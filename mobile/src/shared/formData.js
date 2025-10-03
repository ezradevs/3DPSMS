export const guessMimeType = uri => {
  if (!uri) return 'image/jpeg';
  const extension = uri.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'heic':
      return 'image/heic';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
};

export function buildItemFormData({
  name,
  description,
  price,
  quantity,
  defaultFilamentId,
  tag,
  image,
  removeImage,
}) {
  const form = new FormData();
  form.append('name', name);
  if (description != null) form.append('description', description);
  if (price != null) form.append('price', String(price));
  if (quantity != null) form.append('quantity', String(quantity));
  if (defaultFilamentId != null) {
    form.append('defaultFilamentId', String(defaultFilamentId));
  } else {
    form.append('defaultFilamentId', '');
  }
  if (tag != null) form.append('tag', tag);

  if (image && image.uri) {
    form.append('image', {
      uri: image.uri,
      name: image.name || `image-${Date.now()}.jpg`,
      type: image.type || guessMimeType(image.uri),
    });
  }

  if (removeImage) {
    form.append('removeImage', 'true');
  }

  return form;
}
