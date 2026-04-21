import mongoose from 'mongoose'
import Project from '../models/Project.js'
import Task from '../models/Task.js'

// ─── Helpers ───────────────────────────────────────────
const toObjectId = (id: string) => new mongoose.Types.ObjectId(id)

const now = new Date()

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000)

const userScopeFilter = (userId: mongoose.Types.ObjectId) => ({
  $or: [{ owner: userId }, { members: userId }],
})

const taskScopeFilter = (userId: mongoose.Types.ObjectId) => ({
  $or: [{ reporter: userId }, { assignee: userId }],
})

// ─── Dashboard Analytics ──────────────────────────────
const getDashboardAnalytics = async (userId: string) => {
  const userObjectId = toObjectId(userId)

  const projectFilter = userScopeFilter(userObjectId)
  const taskFilter = taskScopeFilter(userObjectId)

  const [
    totalProjects,
    totalTasks,
    projectsByStatus,
    tasksByStatus,
    recentTasks,
    upcomingDeadlines,
    weeklyCompletion,
  ] = await Promise.all([
    Project.countDocuments(projectFilter),

    Task.countDocuments(taskFilter),

    Project.aggregate([
      { $match: projectFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    Task.aggregate([
      { $match: taskFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalLogged: { $sum: '$loggedHours' },
        },
      },
    ]),

    Task.find(taskFilter)
      .sort('-updatedAt')
      .limit(5)
      .populate('project', 'title color')
      .populate('assignee', 'name avatar'),

    Task.find({
      ...taskFilter,
      status: { $ne: 'done' },
      dueDate: {
        $gte: now,
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
      .sort('dueDate')
      .limit(8)
      .populate('project', 'title color'),

    Task.aggregate([
      {
        $match: {
          ...taskFilter,
          status: 'done',
          updatedAt: { $gte: daysAgo(56) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            week: { $week: '$updatedAt' },
          },
          completed: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          week: '$_id.week',
          completed: 1,
        },
      },
    ]),
  ])

  return {
    summary: { totalProjects, totalTasks },
    projectsByStatus,
    tasksByStatus,
    recentTasks,
    upcomingDeadlines,
    weeklyCompletion,
  }
}

// ─── Project Analytics ────────────────────────────────
const getProjectAnalytics = async (userId: string) => {
  const userObjectId = toObjectId(userId)
  const projectFilter = userScopeFilter(userObjectId)

  const projects = await Project.aggregate([
    { $match: projectFilter },

    {
      $lookup: {
        from: 'tasks',
        localField: '_id',
        foreignField: 'project',
        as: 'tasks',
      },
    },

    {
      $addFields: {
        totalTasks: { $size: '$tasks' },

        doneTasks: {
          $size: {
            $filter: {
              input: '$tasks',
              as: 't',
              cond: { $eq: ['$$t.status', 'done'] },
            },
          },
        },

        overdueTasks: {
          $size: {
            $filter: {
              input: '$tasks',
              as: 't',
              cond: {
                $and: [
                  { $lt: ['$$t.dueDate', now] },
                  { $ne: ['$$t.status', 'done'] },
                ],
              },
            },
          },
        },

        totalLoggedHours: {
          $sum: {
            $map: {
              input: '$tasks',
              as: 't',
              in: '$$t.loggedHours',
            },
          },
        },
      },
    },

    {
      $project: {
        tasks: 0,
        __v: 0,
      },
    },

    { $sort: { createdAt: -1 } },
  ])

  return { projects }
}

// ─── Team Analytics ───────────────────────────────────
const getTeamAnalytics = async (userId: string) => {
  const userObjectId = toObjectId(userId)

  const projectIds = await Project.distinct('_id', userScopeFilter(userObjectId))

  const teamPerformance = await Task.aggregate([
    {
      $match: {
        project: { $in: projectIds },
        assignee: { $exists: true },
      },
    },

    {
      $group: {
        _id: '$assignee',
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] },
        },
        inProgressTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] },
        },
        overdueTasks: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $lt: ['$dueDate', now] },
                  { $ne: ['$status', 'done'] },
                ],
              },
              1,
              0,
            ],
          },
        },
        totalLoggedHours: { $sum: '$loggedHours' },
        totalEstimatedHours: { $sum: '$estimatedHours' },
      },
    },

    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },

    { $unwind: '$user' },

    {
      $project: {
        _id: 0,
        user: {
          _id: '$user._id',
          name: '$user.name',
          avatar: '$user.avatar',
          email: '$user.email',
          role: '$user.role',
        },
        totalTasks: 1,
        completedTasks: 1,
        inProgressTasks: 1,
        overdueTasks: 1,
        totalLoggedHours: 1,
        totalEstimatedHours: 1,
        completionRate: {
          $cond: [
            { $eq: ['$totalTasks', 0] },
            0,
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$completedTasks', '$totalTasks'] },
                    100,
                  ],
                },
                1,
              ],
            },
          ],
        },
      },
    },

    { $sort: { completionRate: -1 } },
  ])

  return { teamPerformance }
}

// ─── Task Analytics ───────────────────────────────────
const getTaskAnalytics = async (userId: string) => {
  const userObjectId = toObjectId(userId)
  const taskFilter = taskScopeFilter(userObjectId)

  const [byStatus, byPriority, overdueCount, avgCompletionTime] =
    await Promise.all([
      Task.aggregate([
        { $match: taskFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      Task.aggregate([
        { $match: taskFilter },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),

      Task.countDocuments({
        ...taskFilter,
        status: { $ne: 'done' },
        dueDate: { $lt: now },
      }),

      Task.aggregate([
        {
          $match: {
            ...taskFilter,
            status: 'done',
            createdAt: { $exists: true },
            updatedAt: { $exists: true },
          },
        },
        {
          $project: {
            completionHours: {
              $divide: [
                { $subtract: ['$updatedAt', '$createdAt'] },
                1000 * 60 * 60,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            avg: { $avg: '$completionHours' },
          },
        },
        {
          $project: {
            _id: 0,
            avgCompletionHours: { $round: ['$avg', 1] },
          },
        },
      ]),
    ])

  return {
    byStatus,
    byPriority,
    overdueCount,
    avgCompletionHours: avgCompletionTime[0]?.avgCompletionHours ?? 0,
  }
}

export const analyticsService = {
  getDashboardAnalytics,
  getProjectAnalytics,
  getTeamAnalytics,
  getTaskAnalytics,
}