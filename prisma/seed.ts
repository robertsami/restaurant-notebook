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
    { name: 'Lou Malnati\'s Pizzeria', location: 'Chicago, IL' },
    { name: 'Alinea', location: 'Chicago, IL' },
    { name: 'Girl & The Goat', location: 'Chicago, IL' },
    { name: 'Portillo\'s', location: 'Chicago, IL' },
    
    // New York
    { name: 'Katz\'s Delicatessen', location: 'New York, NY' },
    { name: 'Eleven Madison Park', location: 'New York, NY' },
    { name: 'Gramercy Tavern', location: 'New York, NY' },
    
    // Los Angeles
    { name: 'Bestia', location: 'Los Angeles, CA' },
    { name: 'Nobu', location: 'Los Angeles, CA' },
    { name: 'In-N-Out Burger', location: 'Los Angeles, CA' },
  ];

  const createdRestaurants = [];
  for (const restaurant of restaurants) {
    const created = await prisma.restaurant.upsert({
      where: { 
        id: restaurant.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
      },
      update: {},
      create: {
        id: restaurant.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: restaurant.name,
        location: restaurant.location,
      },
    });
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
      content: 'Best deep dish pizza in Chicago! The butter crust is amazing.',
      isPublic: true,
    },
    {
      userId: alice.id,
      restaurantId: createdRestaurants.find(r => r.name === 'Alinea')!.id,
      rating: 5,
      content: 'Mind-blowing experience. The edible balloon was so fun!',
      isPublic: true,
    },
    {
      userId: bob.id,
      restaurantId: createdRestaurants.find(r => r.name === 'In-N-Out Burger')!.id,
      rating: 4,
      content: 'Animal style is the way to go. Great fast food burger.',
      isPublic: true,
    },
  ];

  for (const note of notes) {
    await prisma.note.create({
      data: note,
    });
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