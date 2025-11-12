import { DataSource } from 'typeorm';
import { ColorCategory } from '../../settings/color-category/entities/color-category.entity';
import { commonColors } from './color-categories.seed';

export async function seedColors(dataSource: DataSource): Promise<void> {
  const colorCategoryRepository = dataSource.getRepository(ColorCategory);

  console.log('🎨 Starting color categories seeding...');

  for (const colorData of commonColors) {
    // Check if color already exists
    const existingColor = await colorCategoryRepository.findOne({
      where: { name: colorData.name },
    });

    if (existingColor) {
      console.log(`⏭️  Color "${colorData.name}" already exists, skipping...`);
      continue;
    }

    // Create new color
    const color = colorCategoryRepository.create(colorData);
    await colorCategoryRepository.save(color);
    console.log(`✅ Created color: ${colorData.name} (${colorData.hexCode})`);
  }

  console.log(`\n🎉 Color seeding completed! Total: ${commonColors.length} colors`);
}
