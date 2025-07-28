const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Upload file to task
router.post('/upload/:taskId', auth, upload.single('file'), async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const canUpload = 
      req.user.role === 'ADMIN' ||
      task.createdById === req.user.id ||
      task.assignedToId === req.user.id;

    if (!canUpload) {
      return res.status(403).json({ error: 'Not authorized to upload files to this task' });
    }

    // Get the next version number for this specific file name
    const existingFiles = await prisma.file.findMany({
      where: { 
        taskId: parseInt(taskId),
        originalName: req.file.originalname
      },
      orderBy: { version: 'desc' }
    });

    const version = existingFiles.length > 0 ? existingFiles[0].version + 1 : 1;

    const file = await prisma.file.create({
      data: {
        name: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        version,
        taskId: parseInt(taskId),
        uploadedById: req.user.id
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json(file);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Download file
router.get('/download/:fileId', auth, async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await prisma.file.findUnique({
      where: { id: parseInt(fileId) },
      include: {
        task: true
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if user has access to the task
    const canDownload = 
      req.user.role === 'ADMIN' ||
      file.task.createdById === req.user.id ||
      file.task.assignedToId === req.user.id;

    if (!canDownload) {
      return res.status(403).json({ error: 'Not authorized to download this file' });
    }

    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.sendFile(path.resolve(file.path));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get file versions for a task
router.get('/task/:taskId/versions', auth, async (req, res) => {
  try {
    const { taskId } = req.params;

    // Check if task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const canView = 
      req.user.role === 'ADMIN' ||
      task.createdById === req.user.id ||
      task.assignedToId === req.user.id;

    if (!canView) {
      return res.status(403).json({ error: 'Not authorized to view files for this task' });
    }

    const files = await prisma.file.findMany({
      where: { taskId: parseInt(taskId) },
      include: {
        uploadedBy: {
          select: { id: true, name: true }
        },
        remarks: {
          include: {
            author: {
              select: { id: true, name: true, role: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { version: 'desc' }
    });

    res.json(files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add remark to file
router.post('/:fileId/remarks', auth, [
  body('text').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fileId } = req.params;
    const { text } = req.body;

    // Check if file exists and user has access
    const file = await prisma.file.findUnique({
      where: { id: parseInt(fileId) },
      include: { 
        task: {
          select: {
            id: true,
            createdById: true,
            assignedToId: true
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const canAddRemark = 
      req.user.role === 'ADMIN' ||
      file.task.createdById === req.user.id ||
      file.task.assignedToId === req.user.id;

    if (!canAddRemark) {
      return res.status(403).json({ error: 'Not authorized to add remarks to this file' });
    }

    const fileRemark = await prisma.fileRemark.create({
      data: {
        text,
        fileId: parseInt(fileId),
        authorId: req.user.id
      },
      include: {
        author: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    res.status(201).json(fileRemark);
  } catch (error) {
    console.error('Error creating file remark:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get file remarks
router.get('/:fileId/remarks', auth, async (req, res) => {
  try {
    const { fileId } = req.params;

    // Check if file exists and user has access
    const file = await prisma.file.findUnique({
      where: { id: parseInt(fileId) },
      include: { 
        task: {
          select: {
            id: true,
            createdById: true,
            assignedToId: true
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const canView = 
      req.user.role === 'ADMIN' ||
      file.task.createdById === req.user.id ||
      file.task.assignedToId === req.user.id;

    if (!canView) {
      return res.status(403).json({ error: 'Not authorized to view remarks for this file' });
    }

    const fileRemarks = await prisma.fileRemark.findMany({
      where: { fileId: parseInt(fileId) },
      include: {
        author: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(fileRemarks);
  } catch (error) {
    console.error('Error fetching file remarks:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete file remark (Admin only or remark author)
router.delete('/remarks/:remarkId', auth, async (req, res) => {
  try {
    const { remarkId } = req.params;

    const remark = await prisma.fileRemark.findUnique({
      where: { id: parseInt(remarkId) },
      include: {
        author: true,
        file: {
          include: {
            task: true
          }
        }
      }
    });

    if (!remark) {
      return res.status(404).json({ error: 'Remark not found' });
    }

    const canDelete = 
      req.user.role === 'ADMIN' ||
      remark.authorId === req.user.id;

    if (!canDelete) {
      return res.status(403).json({ error: 'Not authorized to delete this remark' });
    }

    await prisma.fileRemark.delete({
      where: { id: parseInt(remarkId) }
    });

    res.json({ message: 'Remark deleted successfully' });
  } catch (error) {
    console.error('Error deleting file remark:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;