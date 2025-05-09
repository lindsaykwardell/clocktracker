import { faker } from "@faker-js/faker";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function globalSetup() {
  // Ensure SUPABASE_URL and SUPABASE_KEY are set in your environment
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "SUPABASE_URL and SUPABASE_KEY must be set in environment variables."
    );
    process.exit(1); // Exit if keys are not found
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = faker.internet.email({ firstName, lastName });
  const password = faker.internet.password();
  const username = faker.internet.userName({ firstName, lastName });
  const displayName = `${firstName} ${lastName}`;
  const pronouns = faker.helpers.arrayElement([
    "he/him",
    "she/her",
    "they/them",
    null,
  ]);
  const bio = faker.lorem.sentence();
  const location = `${faker.location.city()}, ${faker.location.state({
    abbreviated: true,
  })}`;

  let authUserId = faker.string.uuid(); // Default to a faker UUID

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Error signing up Supabase auth user:", error.message);
      // Exit or fallback, for now, we proceed with Faker UUID for account object, but Prisma insert will likely fail.
    } else if (data.user) {
      console.log("Supabase auth user signed up successfully:", data.user.id);
      authUserId = data.user.id; // Use the actual user ID from Supabase
    } else {
      console.warn("Supabase signUp did not return a user or an error.");
      // Exit or fallback, for now, we proceed with Faker UUID for account object, but Prisma insert will likely fail.
    }
  } catch (e: any) {
    console.error("Exception during Supabase signUp:", e.message);
    // Exit or fallback
  }

  const account = {
    user_id: authUserId, // This will be the Supabase auth user ID
    firstName: firstName,
    lastName: lastName,
    username: username,
    display_name: displayName,
    email: email,
    password: password, // Storing password for test reference, not for Prisma
    pronouns: pronouns,
    bio: bio,
    location: location,
  };

  // Create UserSettings record in Prisma
  if (authUserId !== faker.string.uuid()) {
    // Only attempt if Supabase signup seemed to give a real ID
    try {
      await prisma.userSettings.create({
        data: {
          user_id: account.user_id,
          username: account.username,
          display_name: account.display_name,
          email: account.email,
          // Map other fields from 'account' to your UserSettings model as needed
          // For example, if your UserSettings has these fields:
          pronouns: account.pronouns,
          bio: account.bio,
          location: account.location,
          // Ensure all required fields in UserSettings are provided
          finished_welcome: false, // Example default value
          privacy: "PUBLIC", // Example default value for enum
        },
      });
      console.log(
        `Prisma UserSettings record created for user_id: ${account.user_id}`
      );
    } catch (e: any) {
      console.error("Error creating Prisma UserSettings record:", e.message);
      // Handle Prisma error, perhaps by exiting or cleaning up the auth user if critical
    }
  }

  const testDir = path.resolve(__dirname);
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const filePath = path.join(testDir, "test-account.json");
  // Save the account object (which includes Supabase ID and other details) to the JSON file
  fs.writeFileSync(filePath, JSON.stringify(account, null, 2));
  console.log(
    `Test account data saved to ${filePath} with user_id: ${account.user_id}`
  );

  await prisma.$disconnect(); // Disconnect Prisma client
}

export default globalSetup;
