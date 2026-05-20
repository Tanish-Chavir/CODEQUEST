import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await mongoose.connect('mongodb://localhost:27017/codequest');
console.log('✅ Connected to MongoDB');

const users = await User.find({}, '-password').sort({ xp: -1 });
console.log(`\n📋 Found ${users.length} user(s) in database:`);
users.forEach(u => {
  console.log(`  → ${u.username} | ${u.email} | XP: ${u.xp} | Level: ${u.level} | Watch: ${u.watchTime}s | Quizzes: ${u.quizzesTaken} | Correct: ${u.correctAnswers}`);
});

// ── Excel Export ────────────────────────────────────
const exportData = users.map(u => ({
  'User ID': u._id.toString(),
  'Username': u.username,
  'Email': u.email,
  'Role': u.role || 'user',
  'Level': u.level,
  'Total XP': u.xp,
  'Coins': u.coins,
  'Watch Time (Minutes)': Math.round((u.watchTime || 0) / 60),
  'Quizzes Taken': u.quizzesTaken || 0,
  'Correct Answers': u.correctAnswers || 0,
  'Accuracy (%)': u.quizzesTaken > 0 ? Math.round(((u.correctAnswers || 0) / u.quizzesTaken) * 100) : 0,
  'Joined Date': new Date(u.createdAt).toLocaleDateString('en-IN'),
  'Last Updated': new Date(u.updatedAt).toLocaleDateString('en-IN'),
}));

const worksheet = xlsx.utils.json_to_sheet(exportData);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, 'Users');

// Auto-size columns
if (exportData.length > 0) {
  const maxWidths = Object.keys(exportData[0]).map(key => ({
    wch: Math.max(key.length, ...exportData.map(r => String(r[key] ?? '').length)) + 2
  }));
  worksheet['!cols'] = maxWidths;
}

const outPath = path.join(__dirname, 'CodeQuest_User_Analytics.xlsx');
xlsx.writeFile(workbook, outPath);
console.log(`\n✅ Excel exported to: ${outPath}`);

// ── Ethereal Email Test ─────────────────────────────
const testAccount = await nodemailer.createTestAccount();
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: { user: testAccount.user, pass: testAccount.pass },
});

const targetUser = users.find(u => u.email === 'tc.random.edits@gmail.com') || users[0];

const info = await transporter.sendMail({
  from: '"CodeQuest" <noreply@codequest.app>',
  to: targetUser.email,
  subject: 'New Login to CodeQuest 🔐',
  html: `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0f0f0f;color:#fff;padding:32px;border-radius:12px;border:1px solid #7c3aed">
      <h1 style="color:#7c3aed;margin-bottom:4px">⚡ CodeQuest</h1>
      <p style="color:#888;margin-top:0">Gamified Coding Learning Platform</p>
      <hr style="border-color:#333;margin:16px 0"/>
      <h2 style="color:#fff">New Login Detected 🔐</h2>
      <p>Hi <strong style="color:#a78bfa">${targetUser.username}</strong>,</p>
      <p>We detected a successful login to your CodeQuest account using:</p>
      <div style="background:#1a1a2e;padding:12px 16px;border-radius:8px;border-left:4px solid #7c3aed;margin:16px 0">
        <strong>📧 Email:</strong> ${targetUser.email}<br/>
        <strong>⏰ Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
      </div>
      <p>If this was you, no action is needed. Keep levelling up your skills!</p>
      <div style="background:#7c3aed;padding:14px 24px;border-radius:8px;text-align:center;margin:24px 0">
        <strong>Your current stats:</strong> Level ${targetUser.level} · ${targetUser.xp} XP · ${targetUser.quizzesTaken} Quizzes
      </div>
      <p style="color:#888;font-size:12px">If this wasn't you, please change your password immediately.</p>
    </div>
  `
});

console.log('\n📧 LOGIN EMAIL PREVIEW:');
console.log('   Open this URL in your browser to see the email:');
console.log(`\n   👉 ${nodemailer.getTestMessageUrl(info)}\n`);

await mongoose.disconnect();
