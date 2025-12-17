import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

// Parse SQL INSERT statements from the uploaded file
function parseInsertStatements(sqlContent: string) {
  console.log("🔍 Starting SQL parsing...");
  console.log(`📄 SQL content length: ${sqlContent.length} characters`);

  const users: any[] = [];

  // Match INSERT INTO statements with VALUES
  const insertRegex =
    /INSERT INTO `users`[^(]*\([^)]+\)\s+VALUES\s*([\s\S]+?);/g;
  const matches = Array.from(sqlContent.matchAll(insertRegex));

  console.log(`✅ Found ${matches.length} INSERT statements`);

  for (const match of matches) {
    const valuesSection = match[1];

    // Split by ),( to get individual user records
    const userRecords = valuesSection.split(/\),\s*\(/);
    console.log(
      `📦 Processing ${userRecords.length} user records from this INSERT statement`
    );

    for (let record of userRecords) {
      // Clean up the record
      record = record.replace(/^\(/, "").replace(/\)$/, "");

      // Parse the values - handle quoted strings and NULLs
      const values: string[] = [];
      let currentValue = "";
      let inQuote = false;
      let escapeNext = false;

      for (let i = 0; i < record.length; i++) {
        const char = record[i];

        if (escapeNext) {
          currentValue += char;
          escapeNext = false;
          continue;
        }

        if (char === "\\") {
          escapeNext = true;
          continue;
        }

        if (char === "'" && !escapeNext) {
          if (inQuote) {
            // Check if it's a doubled quote (escaped)
            if (record[i + 1] === "'") {
              currentValue += "'";
              i++;
            } else {
              inQuote = false;
            }
          } else {
            inQuote = true;
          }
          continue;
        }

        if (char === "," && !inQuote) {
          values.push(currentValue.trim());
          currentValue = "";
          continue;
        }

        currentValue += char;
      }

      // Add the last value
      if (currentValue) {
        values.push(currentValue.trim());
      }

      if (values.length >= 19) {
        // Map SQL fields to our schema
        // SQL: id, user_name, phone, email, date, time, balance, password, token,
        //      bank_account, account_number, bank_name, account_number_22, json,
        //      currency, del, promo_code, country, bank_token

        const email = values[3] || "";
        const phone = values[2] || "";
        const userName = values[1] || "";

        // Skip if essential fields are missing
        if (!email || !userName) {
          console.log(
            `⚠️ Skipping record - missing essential fields (email: ${email}, userName: ${userName})`
          );
          continue;
        }

        const userData = {
          email,
          phone: phone || null,
          userName,
          name: userName,
          password: values[7] || "", // Already hashed in the SQL
          balance: parseFloat(values[6] || "0"),
          currency: values[14] || "NGN",
          bankAccount: values[9] === "YES" ? "YES" : null,
          accountNumber: values[10] || null,
          bankName: values[11] || null,
          promoCode: values[16] || null,
          country: values[17] || null,
          emailVerified: false,
          phoneVerified: false,
          status: "ACTIVE",
          role: "USER",
        };

        console.log(
          `👤 Parsed user: ${email} (${userName}) - Balance: ${userData.balance} ${userData.currency}`
        );
        users.push(userData);
      }
    }
  }

  console.log(`✅ Parsing complete. Total valid users: ${users.length}`);
  return users;
}

export async function POST(request: NextRequest) {
  console.log("\n🚀 ========== MIGRATION REQUEST STARTED ==========");
  const startTime = Date.now();

  try {
    // Get the uploaded file
    console.log("📥 Receiving file upload...");
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log("❌ No file uploaded");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log(
      `📁 File received: ${file.name} (${file.size} bytes, ${file.type})`
    );

    // Read the file content
    console.log("📖 Reading file content...");
    const content = await file.text();
    console.log(`✅ File content read successfully`);

    // Parse the SQL file
    console.log("\n🔧 Starting SQL parsing...");
    const users = parseInsertStatements(content);

    if (users.length === 0) {
      console.log("❌ No valid user data found in the file");
      return NextResponse.json(
        { error: "No valid user data found in the file" },
        { status: 400 }
      );
    }

    console.log(
      `\n💾 Starting database migration for ${users.length} users...`
    );

    // Migrate users to database
    let migratedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const userData of users) {
      try {
        console.log(`\n🔍 Checking user: ${userData.email}`);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email },
        });

        if (existingUser) {
          console.log(`⏭️ User already exists, skipping: ${userData.email}`);
          skippedCount++;
          continue;
        }

        // Generate a unique referral code
        const referralCode = `REF${Date.now()}${Math.random()
          .toString(36)
          .substring(2, 7)
          .toUpperCase()}`;

        console.log(
          `➕ Creating user: ${userData.email} with referral code: ${referralCode}`
        );

        // Create the user
        await prisma.user.create({
          data: {
            ...userData,
            referralCode,
          },
        });

        console.log(`✅ Successfully created user: ${userData.email}`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ Error migrating user ${userData.email}:`, error);
        errors.push(
          `Failed to migrate ${userData.email}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    console.log("\n📊 ========== MIGRATION SUMMARY ==========");
    console.log(`✅ Successfully migrated: ${migratedCount} users`);
    console.log(`⏭️ Skipped (already exist): ${skippedCount} users`);
    console.log(`❌ Failed: ${errors.length} users`);
    console.log(
      `⏱️ Total time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`
    );
    console.log("========================================\n");

    const response = {
      success: true,
      message: `Migration completed. ${migratedCount} users migrated, ${skippedCount} skipped (already exist).`,
      migratedCount,
      skippedCount,
      totalProcessed: users.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log("🎉 Migration completed successfully!");
    return NextResponse.json(response);
  } catch (error) {
    console.error("\n💥 ========== MIGRATION ERROR ==========");
    console.error("Migration failed with error:", error);
    console.error("======================================\n");

    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
