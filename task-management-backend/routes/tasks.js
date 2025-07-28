const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const prisma = new PrismaClient();

// Get all tasks
router.get('/', auth, async (req, res) => {
  try {
    const { status, assignedTo, createdBy, taskType } = req.query;
    
    let whereClause = {};
    
    // Apply filters based on user role
    if (req.user.role === 'CLIENT') {
      whereClause.assignedToId = req.user.id;
    }
    
    // Apply additional filters
    if (status) whereClause.status = status;
    if (assignedTo) whereClause.assignedToId = parseInt(assignedTo);
    if (createdBy) whereClause.createdById = parseInt(createdBy);
    if (taskType) whereClause.taskType = taskType;

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        files: {
          select: {
            id: true,
            name: true,
            version: true,
            uploadedAt: true,
            uploadedBy: {
              select: { name: true }
            }
          },
          orderBy: { version: 'desc' }
        },
        remarks: {
          include: {
            author: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            files: true,
            remarks: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create task (Product users and Admin)
router.post('/', auth, authorize('PRODUCT', 'ADMIN'), [
  body('name').notEmpty().trim(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('taskType').isIn(['DESIGN', 'DEVELOPMENT', 'TESTING', 'MARKETING', 'RESEARCH', 'DOCUMENTATION']),
  body('assignedToId').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, startDate, endDate, taskType, assignedToId } = req.body;

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // If assignedToId is provided, check if user exists and is active
    if (assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assignedToId }
      });

      if (!assignee || assignee.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Assigned user not found or inactive' });
      }
    }

    let finalAssigneeId = assignedToId;
    let taskStatus = 'CREATED';

    // Auto-assign to active client if no assignee specified
    if (!assignedToId) {
      const activeClients = await prisma.user.findMany({
        where: {
          role: 'CLIENT',
          status: 'ACTIVE'
        }
      });

      if (activeClients.length > 0) {
        // Simple round-robin assignment
        const taskCount = await prisma.task.count();
        finalAssigneeId = activeClients[taskCount % activeClients.length].id;
        taskStatus = 'ASSIGNED';
      }
    } else {
      taskStatus = 'ASSIGNED';
    }

    const task = await prisma.task.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        taskType,
        status: taskStatus,
        createdById: req.user.id,
        assignedToId: finalAssigneeId
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/status', auth, [
  body('status').isIn(['CREATED', 'ASSIGNED', 'IN_REVIEW', 'REVISION_REQUIRED', 'APPROVED', 'PUBLISHED'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        files: {
          select: {
            id: true,
            name: true,
            originalName: true,
            version: true,
            uploadedAt: true,
            uploadedBy: {
              select: { name: true }
            }
          },
          orderBy: { version: 'desc' }
        },
        remarks: {
          include: {
            author: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add remark to task
router.post('/:id/remarks', auth, [
  body('text').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { text } = req.body;

    const remark = await prisma.remark.create({
      data: {
        text,
        taskId: parseInt(id),
        authorId: req.user.id
      },
      include: {
        author: {
          select: { name: true }
        }
      }
    });

    res.status(201).json(remark);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reassign task (Admin and Product users)
router.patch('/:id/reassign', auth, authorize('ADMIN', 'PRODUCT'), [
  body('assignedToId').isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { assignedToId } = req.body;

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { 
        assignedToId,
        status: 'ASSIGNED',
        updatedAt: new Date()
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;