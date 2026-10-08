import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ItemService, MAX_GALLERY_IMAGES } from './item.service';

const build = (item: any) => {
  const itemRepository = {
    findOne: jest.fn().mockResolvedValue(item),
    update: jest.fn().mockResolvedValue(undefined),
  };
  const itemImageRepository = {
    create: jest.fn((value) => value),
    save: jest.fn((value) => Promise.resolve(Array.isArray(value) ? value : { id: 99, ...value })),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  const userContextService = { getBusinessId: () => 1 };
  const unused = {} as any;

  // Constructor order: item, common, business, account, itemPrice, itemStock,
  // itemStockDistribution, itemAccountMapping, warehouse, itemSupplier,
  // colorCategory, brand, itemImage, review, userContext.
  const service = new ItemService(
    itemRepository as any, unused, unused, unused, unused, unused, unused, unused,
    unused, unused, unused, unused, itemImageRepository as any, unused, userContextService as any,
  );
  return { service, itemRepository, itemImageRepository };
};

const image = (id: number, position: number) => ({ id, url: `https://img/${id}.jpg`, position });

describe('ItemService photo gallery', () => {
  it('makes the first photo of a product its main photo', async () => {
    const { service, itemRepository, itemImageRepository } = build({ id: 5, imageUrl: null, images: [] });
    const gallery = await service.addGalleryImage(5, 'https://img/new.jpg');

    expect(itemRepository.update).toHaveBeenCalledWith(5, { imageUrl: 'https://img/new.jpg' });
    expect(itemImageRepository.save).not.toHaveBeenCalled();
    expect(gallery).toEqual({ main: 'https://img/new.jpg', images: [] });
  });

  it('appends later photos to the end of the gallery', async () => {
    const { service, itemImageRepository } = build({ id: 5, imageUrl: 'https://img/main.jpg', images: [image(1, 0), image(2, 1)] });
    const gallery = await service.addGalleryImage(5, 'https://img/new.jpg');

    expect(itemImageRepository.save).toHaveBeenCalledWith({ itemId: 5, url: 'https://img/new.jpg', position: 2 });
    expect(gallery.images.map((i) => i.id)).toEqual([1, 2, 99]);
  });

  it('refuses another photo once the product is full', async () => {
    const full = Array.from({ length: MAX_GALLERY_IMAGES }, (_, i) => image(i + 1, i));
    const { service } = build({ id: 5, imageUrl: 'https://img/main.jpg', images: full });
    await expect(service.assertGalleryHasRoom(5)).rejects.toThrow(BadRequestException);
  });

  it('allows a photo when there is room', async () => {
    const { service } = build({ id: 5, imageUrl: 'https://img/main.jpg', images: [image(1, 0)] });
    await expect(service.assertGalleryHasRoom(5)).resolves.toBeUndefined();
  });

  it('reorders the gallery to the given ids', async () => {
    const { service } = build({ id: 5, imageUrl: 'https://img/main.jpg', images: [image(1, 0), image(2, 1), image(3, 2)] });
    const gallery = await service.reorderGallery(5, [3, 1, 2]);
    expect(gallery.images.map((i) => i.id)).toEqual([3, 1, 2]);
  });

  it.each([[[1, 2]], [[1, 2, 2]], [[1, 2, 4]], [undefined]])('refuses an order that is not exactly the gallery: %p', async (ids) => {
    const { service, itemImageRepository } = build({ id: 5, imageUrl: 'https://img/main.jpg', images: [image(1, 0), image(2, 1), image(3, 2)] });
    await expect(service.reorderGallery(5, ids as any)).rejects.toThrow(BadRequestException);
    expect(itemImageRepository.save).not.toHaveBeenCalled();
  });

  it('swaps a gallery photo with the main one', async () => {
    const { service, itemRepository } = build({ id: 5, imageUrl: 'https://img/main.jpg', images: [image(1, 0), image(2, 1)] });
    const gallery = await service.makeMainImage(5, 2);

    expect(itemRepository.update).toHaveBeenCalledWith(5, { imageUrl: 'https://img/2.jpg' });
    expect(gallery.main).toBe('https://img/2.jpg');
    expect(gallery.images.find((i) => i.id === 2)?.url).toBe('https://img/main.jpg');
  });

  it('returns the URL of a removed photo so its file can be deleted', async () => {
    const { service, itemImageRepository } = build({ id: 5, imageUrl: 'https://img/main.jpg', images: [image(1, 0), image(2, 1)] });
    const { url, gallery } = await service.removeGalleryImage(5, 1);

    expect(itemImageRepository.delete).toHaveBeenCalledWith(1);
    expect(url).toBe('https://img/1.jpg');
    expect(gallery.images.map((i) => i.id)).toEqual([2]);
  });

  it('answers 404 for a product or photo that does not exist', async () => {
    await expect(build(null).service.getGallery(5)).rejects.toThrow(NotFoundException);
    const { service } = build({ id: 5, imageUrl: null, images: [] });
    await expect(service.removeGalleryImage(5, 123)).rejects.toThrow(NotFoundException);
  });
});
