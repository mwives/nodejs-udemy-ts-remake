import sgMail from "@sendgrid/mail";

import { IUser } from "../ts/interfaces/user_interface";

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function sendWelcomeEmail({ username, email }: IUser) {
  sgMail.send({
    to: email,
    from: "ivo.taskapp@gmail.com",
    templateId: "d-5a6e256d16674a2aa11fc899fa657cb9",
    dynamicTemplateData: {
      name: username,
    },
  });
}

export async function sendCancelationEmail({ username, email }: IUser) {
  sgMail.send({
    to: email,
    from: "ivo.taskapp@gmail.com",
    templateId: "d-2120aac2ac88449bb51e2306e0187a12",
    dynamicTemplateData: {
      name: username,
    },
  });
}
