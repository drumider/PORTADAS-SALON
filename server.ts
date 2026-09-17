import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API route to send email notifications for new bookings
app.post("/api/notify-booking", async (req, res) => {
  const { appointmentDetails } = req.body;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    // If not configured, just log it. The client shouldn't break.
    console.log("Email credentials not configured. Skipping email notification.");
    return res.status(200).json({ status: "skipped", message: "Email credentials not configured." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"AI Assistant" <${process.env.EMAIL_USER}>`,
      to: "contactmantaiweb@gmail.com",
      subject: "Nueva Cita Agendada por el Asistente AI",
      text: `Se ha agendado una nueva cita mediante el asistente:\n\n${JSON.stringify(appointmentDetails, null, 2)}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #8C6B4D;">Nueva Cita Agendada</h2>
          <p>El Asistente AI ha registrado una nueva cita en la agenda.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #ddd;">
            <p><strong>Cliente:</strong> ${appointmentDetails?.clientName || 'N/A'}</p>
            <p><strong>Servicio:</strong> ${appointmentDetails?.service || 'N/A'}</p>
            <p><strong>Estilista:</strong> ${appointmentDetails?.stylistName || 'N/A'}</p>
            <p><strong>Fecha:</strong> ${appointmentDetails?.date || 'N/A'}</p>
            <p><strong>Hora:</strong> ${appointmentDetails?.time || 'N/A'}</p>
          </div>
          <p style="font-size: 12px; color: #777; margin-top: 20px;">
            Este es un mensaje automático generado por tu sistema.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ status: "error", message: "Failed to send email." });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
