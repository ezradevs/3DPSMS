const { Router } = require('express');
const inventoryService = require('../services/inventoryService');
const upload = require('../middleware/upload');
const { toRelativeUploadPath, deleteFileSafe } = require('../utils/files');

const router = Router();

router.get('/', (_req, res, next) => {
  try {
    const items = inventoryService.listItems();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const item = inventoryService.getItemById(Number(req.params.id));
    if (!item) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.post('/', upload.single('image'), (req, res, next) => {
  const uploadedFile = req.file;
  try {
    const { name, description, price, quantity, defaultFilamentId, tag } = req.body;
    if (!name) {
      res.status(400).json({ message: 'Name is required' });
      if (uploadedFile) {
        deleteFileSafe(toRelativeUploadPath(uploadedFile.filename));
      }
      return;
    }

    const item = inventoryService.createItem({
      name,
      description,
      price: price !== undefined ? Number(price) : undefined,
      quantity: quantity !== undefined ? Number(quantity) : undefined,
      imagePath: uploadedFile ? toRelativeUploadPath(uploadedFile.filename) : undefined,
      defaultFilamentId: defaultFilamentId ? Number(defaultFilamentId) : undefined,
      tag: tag || undefined,
    });
    res.status(201).json(item);
  } catch (error) {
    if (uploadedFile) {
      deleteFileSafe(toRelativeUploadPath(uploadedFile.filename));
    }
    next(error);
  }
});

router.put('/:id', upload.single('image'), (req, res, next) => {
  const uploadedFile = req.file;
  try {
    const { name, description, price, quantity, removeImage, defaultFilamentId, tag } = req.body;

    const shouldRemoveImage = removeImage === 'true' || removeImage === true;
    const imagePath = shouldRemoveImage
      ? null
      : uploadedFile
        ? toRelativeUploadPath(uploadedFile.filename)
        : undefined;

    const item = inventoryService.updateItem(Number(req.params.id), {
      name,
      description,
      price: price !== undefined ? Number(price) : undefined,
      quantity: quantity !== undefined ? Number(quantity) : undefined,
      imagePath,
      defaultFilamentId: defaultFilamentId !== undefined && defaultFilamentId !== ''
        ? Number(defaultFilamentId)
        : defaultFilamentId === '' ? null : undefined,
      tag: tag !== undefined ? (tag === '' ? null : tag) : undefined,
    });

    res.json(item);
  } catch (error) {
    if (uploadedFile) {
      deleteFileSafe(toRelativeUploadPath(uploadedFile.filename));
    }
    next(error);
  }
});

router.post('/:id/adjust', (req, res, next) => {
  try {
    const { delta, reason } = req.body;
    const parsedDelta = Number(delta);
    if (!Number.isInteger(parsedDelta) || parsedDelta === 0) {
      res.status(400).json({ message: 'Delta must be a non-zero integer' });
      return;
    }

    const item = inventoryService.adjustQuantity({
      itemId: Number(req.params.id),
      delta: parsedDelta,
      reason: reason || 'manual',
    });

    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    inventoryService.deleteItem(Number(req.params.id));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
