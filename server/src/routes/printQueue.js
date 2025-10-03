const path = require('path');
const { Router } = require('express');
const { uploadModel } = require('../middleware/modelUpload');
const { toRelativeUploadPath, deleteFileSafe } = require('../utils/files');
const printQueueService = require('../services/printQueueService');

const router = Router();

router.get('/', (req, res, next) => {
  try {
    const { status, assignee } = req.query;
    const jobs = printQueueService.listJobs({ status, assignee });
    res.json(jobs);
  } catch (error) {
    next(error);
  }
});

router.post('/', uploadModel.single('modelFile'), (req, res, next) => {
  const uploadedFile = req.file;
  try {
    const storedPath = uploadedFile
      ? toRelativeUploadPath(path.posix.join('models', uploadedFile.filename))
      : null;
    const job = printQueueService.createJob({
      itemName: req.body.itemName,
      filamentSpoolId: req.body.filamentSpoolId ? Number(req.body.filamentSpoolId) : null,
      quantity: req.body.quantity ? Number(req.body.quantity) : undefined,
      assignee: req.body.assignee,
      notes: req.body.notes,
      modelUrl: req.body.modelUrl,
      modelFilePath: storedPath,
      status: req.body.status,
      priority: req.body.priority ? Number(req.body.priority) : undefined,
      dueDate: req.body.dueDate,
    });
    res.status(201).json(job);
  } catch (error) {
    if (uploadedFile) {
      deleteFileSafe(path.posix.join('uploads', 'models', uploadedFile.filename));
    }
    next(error);
  }
});

router.put('/:id', uploadModel.single('modelFile'), (req, res, next) => {
  const uploadedFile = req.file;
  try {
    const existing = printQueueService.getJobById(Number(req.params.id));
    if (!existing) {
      if (uploadedFile) {
        deleteFileSafe(path.posix.join('uploads', 'models', uploadedFile.filename));
      }
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    const storedPath = uploadedFile
      ? toRelativeUploadPath(path.posix.join('models', uploadedFile.filename))
      : undefined;
    const job = printQueueService.updateJob(Number(req.params.id), {
      itemName: req.body.itemName,
      filamentSpoolId: req.body.filamentSpoolId !== undefined && req.body.filamentSpoolId !== ''
        ? Number(req.body.filamentSpoolId)
        : req.body.filamentSpoolId === '' ? null : undefined,
      quantity: req.body.quantity,
      assignee: req.body.assignee,
      notes: req.body.notes,
      modelUrl: req.body.modelUrl,
      modelFilePath: storedPath,
      status: req.body.status,
      priority: req.body.priority,
      dueDate: req.body.dueDate,
    });
    if (uploadedFile && existing.modelFilePath && existing.modelFilePath !== job.modelFilePath) {
      deleteFileSafe(existing.modelFilePath);
    }
    res.json(job);
  } catch (error) {
    if (uploadedFile) {
      deleteFileSafe(path.posix.join('uploads', 'models', uploadedFile.filename));
    }
    next(error);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const existing = printQueueService.deleteJob(Number(req.params.id));
    if (existing && existing.model_file_path) {
      deleteFileSafe(existing.model_file_path);
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
