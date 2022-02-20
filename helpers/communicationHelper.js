"use strict";
import nodemailer from "nodemailer";

/**
 * Sends email to the requested recipient
 *
 * @param {Map} mailReq contains the following:
 *    recipientEmail - the email address of the recipient
 *    msgPlainText - text version of the msg body
 *    htmlMsg - html version of the msg body
 *    subject - subject of the email
 * @returns bool
 */
export async function sendEmail(mailReq) {
  let recipient = mailReq.recipient;
  let msgPlainText = mailReq.msgPlainText;
  let htmlMsg = mailReq.htmlMsg;
  let subject = mailReq.subject;
  try {
    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "antone39@ethereal.email",
        pass: "bdFSaFU9ah699ZWK3a",
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"Fred Foo 👻" <neverreply@boo.com>', // sender address
      to: recipient, // list of receivers
      subject: `${subject} ✔`, // Subject line
      text: msgPlainText, // plain text body
      html: htmlMsg, // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

    return true;
  } catch (error) {
    console.log(`Error sending email: ${error.toString()}`);
    return false;
  }
}
