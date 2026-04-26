// ============================================================
// Database Seed Script
// ============================================================
// Creates sample books, vendors, and a pending registration
// request for testing. Run with: npm run db:seed
// ============================================================

import { PrismaClient } from "@prisma/client";
import { auth } from "../src/lib/auth";

const prisma = new PrismaClient();

const adminAccount = {
  name: "Admin User",
  email: "admin@outr.ac.in",
  password: "Admin@12345",
};

async function main() {
  console.log("🌱 Seeding database...");

  // Create sample books
  const books = [
    {
      id: "book-1",
      title: "Clean Code",
      author: "Robert C. Martin",
      isbn: "978-0132350884",
      publisher: "Prentice Hall",
      category: "Software Engineering",
      subject: "Programming",
      description: "A Handbook of Agile Software Craftsmanship",
      totalCopies: 5,
      availableCopies: 5,
      location: "Shelf A1",
    },
    {
      id: "book-2",
      title: "The Pragmatic Programmer",
      author: "Andrew Hunt, David Thomas",
      isbn: "978-0135957059",
      publisher: "Addison-Wesley",
      category: "Software Engineering",
      subject: "Programming",
      description: "Your Journey to Mastery, 20th Anniversary Edition",
      totalCopies: 3,
      availableCopies: 3,
      location: "Shelf A1",
    },
    {
      id: "book-3",
      title: "Design Patterns",
      author: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
      isbn: "978-0201633610",
      publisher: "Addison-Wesley",
      category: "Software Engineering",
      subject: "Design",
      description: "Elements of Reusable Object-Oriented Software",
      totalCopies: 4,
      availableCopies: 4,
      location: "Shelf A2",
    },
    {
      id: "book-4",
      title: "Introduction to Algorithms",
      author: "Thomas H. Cormen",
      isbn: "978-0262033848",
      publisher: "MIT Press",
      category: "Computer Science",
      subject: "Algorithms",
      description: "Comprehensive textbook on algorithms",
      totalCopies: 6,
      availableCopies: 6,
      location: "Shelf B1",
    },
    {
      id: "book-5",
      title: "The Art of Computer Programming",
      author: "Donald E. Knuth",
      isbn: "978-0201896831",
      publisher: "Addison-Wesley",
      category: "Computer Science",
      subject: "Programming",
      description: "Volume 1: Fundamental Algorithms",
      totalCopies: 2,
      availableCopies: 2,
      location: "Shelf B1",
    },
    {
      id: "book-6",
      title: "Database System Concepts",
      author: "Abraham Silberschatz",
      isbn: "978-0078022159",
      publisher: "McGraw-Hill",
      category: "Computer Science",
      subject: "Databases",
      description: "Comprehensive introduction to database systems",
      totalCopies: 4,
      availableCopies: 4,
      location: "Shelf B2",
    },
    {
      id: "book-7",
      title: "Artificial Intelligence: A Modern Approach",
      author: "Stuart Russell, Peter Norvig",
      isbn: "978-0134610993",
      publisher: "Pearson",
      category: "Artificial Intelligence",
      subject: "AI/ML",
      description: "The leading textbook in Artificial Intelligence",
      totalCopies: 3,
      availableCopies: 3,
      location: "Shelf C1",
    },
    {
      id: "book-8",
      title: "Operating System Concepts",
      author: "Abraham Silberschatz, Peter B. Galvin",
      isbn: "978-1119800361",
      publisher: "Wiley",
      category: "Computer Science",
      subject: "Operating Systems",
      description: "Essential concepts of operating systems",
      totalCopies: 5,
      availableCopies: 5,
      location: "Shelf C2",
    },
  ];

  for (const book of books) {
    await prisma.book.upsert({
      where: { isbn: book.isbn },
      update: {},
      create: book,
    });
  }

  // Create sample vendors
  await prisma.vendor.upsert({
    where: { id: "vendor-1" },
    update: {},
    create: {
      id: "vendor-1",
      name: "TechBooks International",
      email: "orders@techbooks.com",
      phone: "+1-555-0100",
      address: "123 Publisher Lane, New York, NY 10001",
    },
  });

  await prisma.vendor.upsert({
    where: { id: "vendor-2" },
    update: {},
    create: {
      id: "vendor-2",
      name: "Academic Press Ltd",
      email: "sales@academicpress.com",
      phone: "+1-555-0200",
      address: "456 University Ave, Boston, MA 02101",
    },
  });

  // Create a sample pending registration request for testing
  const existingRequest = await prisma.registrationRequest.findUnique({
    where: { email: "student@example.com" },
  });
  if (!existingRequest) {
    await prisma.registrationRequest.create({
      data: {
        name: "Jane Student",
        email: "student@example.com",
        password: "hashed_sample_password_not_real",
        status: "PENDING",
      },
    });
    console.log("📋 Created sample pending registration request");
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminAccount.email },
  });
  if (!existingAdmin) {
    const response = await auth.api.signUpEmail({
      body: adminAccount,
    });

    if (!response?.user) {
      throw new Error("Failed to create seeded admin account");
    }

    console.log("👤 Created seeded admin account");
  }

  console.log("✅ Seed complete!");
  console.log("📚 Created 8 sample books");
  console.log("🏢 Created 2 sample vendors");
  console.log("");
  console.log("📝 Seeded admin login:");
  console.log(`   Email: ${adminAccount.email}`);
  console.log(`   Password: ${adminAccount.password}`);
  console.log("   First seeded user is auto-promoted to admin");
  console.log("");
  console.log("📋 A sample pending registration request (student@example.com) is ready for testing.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
