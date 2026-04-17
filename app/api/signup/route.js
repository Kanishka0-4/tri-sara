import { NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const allowedDomains = [
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "hotmail.com",
      "icloud.com",
    ];

    const domain = email.split("@")[1].toLowerCase();
    if (!allowedDomains.includes(domain)) {
      return NextResponse.json(
        { error: "Please use a valid email provider" },
        { status: 400 }
      );
    }

    // ✅ Check existing user
    const existing = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // ✅ Insert user + RETURN ID
    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, email",
      [name, email, hashedPassword]
    );

    const user = result.rows[0];

    // ✅ CREATE TOKEN (THIS WAS MISSING 🔥)
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ RESPONSE + COOKIE
    const response = NextResponse.json({
      success: true,
      quiz_completed: false,
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}