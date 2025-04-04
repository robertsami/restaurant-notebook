import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test users
  const alicePassword = await hash('password', 10);
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice',
      password: alicePassword,
    },
  });

  const bobPassword = await hash('password', 10);
  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob',
      password: bobPassword,
    },
  });

  console.log('Created users:', { alice: alice.id, bob: bob.id });

  // Create sample restaurants
  const restaurants = [
    // Chicago
    { 
      name: 'Lou Malnati\'s Pizzeria', 
      location: 'Chicago, IL',
      tags: ['pizza', 'deep dish', 'italian', 'casual', 'family-friendly'],
      createdBy: alice.id
    },
    { 
      name: 'Alinea', 
      location: 'Chicago, IL',
      tags: ['fine dining', 'molecular gastronomy', 'expensive', 'date night', 'tasting menu'],
      createdBy: alice.id
    },
    { 
      name: 'Girl & The Goat', 
      location: 'Chicago, IL',
      tags: ['american', 'small plates', 'trendy', 'upscale', 'creative'],
      createdBy: alice.id
    },
    { 
      name: 'Portillo\'s', 
      location: 'Chicago, IL',
      tags: ['hot dogs', 'italian beef', 'fast casual', 'affordable', 'chicago classic'],
      createdBy: bob.id
    },
    
    // New York
    { 
      name: 'Katz\'s Delicatessen', 
      location: 'New York, NY',
      tags: ['deli', 'pastrami', 'sandwiches', 'casual', 'iconic'],
      createdBy: bob.id
    },
    { 
      name: 'Eleven Madison Park', 
      location: 'New York, NY',
      tags: ['fine dining', 'plant-based', 'expensive', 'tasting menu', 'michelin star'],
      createdBy: alice.id
    },
    { 
      name: 'Gramercy Tavern', 
      location: 'New York, NY',
      tags: ['american', 'farm-to-table', 'upscale', 'romantic', 'seasonal'],
      createdBy: bob.id
    },
    
    // Los Angeles
    { 
      name: 'Bestia', 
      location: 'Los Angeles, CA',
      tags: ['italian', 'trendy', 'pasta', 'date night', 'upscale'],
      createdBy: alice.id
    },
    { 
      name: 'Nobu', 
      location: 'Los Angeles, CA',
      tags: ['japanese', 'sushi', 'celebrity', 'expensive', 'upscale'],
      createdBy: bob.id
    },
    { 
      name: 'In-N-Out Burger', 
      location: 'Los Angeles, CA',
      tags: ['burgers', 'fast food', 'affordable', 'iconic', 'casual'],
      createdBy: alice.id
    },
  ];

  const createdRestaurants = [];
  for (const restaurant of restaurants) {
    // Create the restaurant with tagsJson
    const created = await prisma.restaurant.upsert({
      where: { 
        id: restaurant.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
      },
      update: {},
      create: {
        id: restaurant.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: restaurant.name,
        location: restaurant.location,
        tagsJson: JSON.stringify(restaurant.tags),
        createdBy: restaurant.createdBy
      },
    });
    
    // Create the tags
    for (const tag of restaurant.tags) {
      await prisma.restaurantTag.upsert({
        where: {
          restaurantId_name: {
            restaurantId: created.id,
            name: tag
          }
        },
        update: {},
        create: {
          name: tag,
          restaurantId: created.id,
          isAiGenerated: false
        }
      });
    }
    
    createdRestaurants.push(created);
  }

  console.log(`Created ${createdRestaurants.length} restaurants`);

  // Create sample lists
  const lists = [
    { 
      title: 'Chicago Eats', 
      description: 'Best places to eat in Chicago',
      ownerId: alice.id,
      restaurants: createdRestaurants.filter(r => r.location === 'Chicago, IL'),
    },
    { 
      title: 'Date Nights', 
      description: 'Romantic restaurants for special occasions',
      ownerId: alice.id,
      restaurants: [
        createdRestaurants.find(r => r.name === 'Alinea')!,
        createdRestaurants.find(r => r.name === 'Eleven Madison Park')!,
        createdRestaurants.find(r => r.name === 'Bestia')!,
      ],
    },
    { 
      title: 'Taco Tuesday', 
      description: 'Best taco spots',
      ownerId: bob.id,
      restaurants: [],
    },
  ];

  for (const list of lists) {
    const createdList = await prisma.restaurantList.upsert({
      where: { 
        id: `${list.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${list.ownerId.substring(0, 8)}`
      },
      update: {},
      create: {
        id: `${list.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${list.ownerId.substring(0, 8)}`,
        title: list.title,
        description: list.description,
        ownerId: list.ownerId,
      },
    });

    // Add restaurants to list
    for (let i = 0; i < list.restaurants.length; i++) {
      await prisma.listRestaurant.upsert({
        where: {
          listId_restaurantId: {
            listId: createdList.id,
            restaurantId: list.restaurants[i].id,
          },
        },
        update: { order: i },
        create: {
          listId: createdList.id,
          restaurantId: list.restaurants[i].id,
          order: i,
        },
      });
    }

    console.log(`Created list: ${list.title} with ${list.restaurants.length} restaurants`);
  }

  // Add some sample notes
  const notes = [
    {
      userId: alice.id,
      restaurantId: createdRestaurants.find(r => r.name === 'Lou Malnati\'s Pizzeria')!.id,
      rating: 5,
      content: 'Best deep dish pizza in Chicago! The butter crust is amazing. I loved the cheese pull and the chunky tomato sauce. The atmosphere was cozy and the service was friendly. Will definitely be back next time I\'m in Chicago.',
      isPublic: true,
      visitDate: new Date('2023-10-15'),
      photosJson: JSON.stringify([]),
    },
    {
      userId: alice.id,
      restaurantId: createdRestaurants.find(r => r.name === 'Alinea')!.id,
      rating: 5,
      content: 'Mind-blowing experience. The edible balloon was so fun! Every course was like a work of art. The service was impeccable and the wine pairings were perfect. Expensive but worth it for a special occasion.',
      isPublic: true,
      visitDate: new Date('2023-11-20'),
      photosJson: JSON.stringify([]),
    },
    {
      userId: bob.id,
      restaurantId: createdRestaurants.find(r => r.name === 'In-N-Out Burger')!.id,
      rating: 4,
      content: 'Animal style is the way to go. Great fast food burger. The fries were a bit underwhelming but the burger was juicy and delicious. Love the secret menu options and the price can\'t be beat.',
      isPublic: true,
      visitDate: new Date('2023-09-05'),
      photosJson: JSON.stringify([]),
    },
    {
      userId: bob.id,
      restaurantId: createdRestaurants.find(r => r.name === 'Nobu')!.id,
      rating: 3,
      content: 'The food was good but not worth the hype or the price. The black cod with miso was the standout dish. Service was a bit pretentious and the atmosphere felt more about being seen than about the food.',
      isPublic: false,
      visitDate: new Date('2023-12-01'),
      photosJson: JSON.stringify([]),
    },
  ];

  for (const note of notes) {
    await prisma.note.create({
      data: note,
    });
  }
  
  // Update restaurant average ratings
  for (const restaurant of createdRestaurants) {
    const restaurantNotes = await prisma.note.findMany({
      where: {
        restaurantId: restaurant.id,
        rating: {
          not: null,
        },
      },
      select: {
        rating: true,
      },
    });

    if (restaurantNotes.length > 0) {
      const sum = restaurantNotes.reduce((acc, note) => acc + (note.rating || 0), 0);
      const average = sum / restaurantNotes.length;

      await prisma.restaurant.update({
        where: {
          id: restaurant.id,
        },
        data: {
          averageRating: average,
        },
      });
    }
  }

  console.log(`Created ${notes.length} notes`);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });