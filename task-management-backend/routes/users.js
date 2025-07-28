const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (Admin only)
router.get('/', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            assignedTasks: true,
            createdTasks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get active client users
router.get('/clients/active', auth, async (req, res) => {
  try {
    const clients = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    res.json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user status (Admin only)
router.patch('/:id/status', auth, authorize('ADMIN'), [
  body('status').isIn(['ACTIVE', 'INACTIVE'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true
      }
    });

    // If user is being deactivated, reassign their tasks
    if (status === 'INACTIVE') {
      const activeTasks = await prisma.task.findMany({
        where: {
          assignedToId: parseInt(id),
          status: {
            in: ['CREATED', 'ASSIGNED', 'IN_REVIEW', 'REVISION_REQUIRED']
          }
        }
      });

      // Find available client users for reassignment
      const availableClients = await prisma.user.findMany({
        where: {
          role: 'CLIENT',
          status: 'ACTIVE',
          id: { not: parseInt(id) }
        }
      });

      if (availableClients.length > 0) {
        // Reassign tasks in round-robin fashion
        for (let i = 0; i < activeTasks.length; i++) {
          const assigneeIndex = i % availableClients.length;
          await prisma.task.update({
            where: { id: activeTasks[i].id },
            data: { assignedToId: availableClients[assigneeIndex].id }
          });
        }
      }
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (Admin only)
router.delete('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has active tasks
    const taskCount = await prisma.task.count({
      where: {
        OR: [
          { createdById: parseInt(id) },
          { assignedToId: parseInt(id) }
        ],
        status: {
          not: 'PUBLISHED'
        }
      }
    });

    if (taskCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete user with active tasks. Please reassign or complete tasks first.' 
      });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
