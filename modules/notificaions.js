const admin = require("firebase-admin");
const mongoose = require("mongoose");
const Device = mongoose.model("Device");
const Notification = mongoose.model("Notification");

/**
 * Send a notificaions to a user(s) with a message and a title.
 * Returns a promise of the status
 */
function sendNotificaion(senderId, receiverId, body, title) {
  return new Promise((resolutionFunc, rejectionFunc) => {
    Device.findOne({ user: receiverId }).then((device) => {
      if (!device)
        return rejectionFunc(new Error("User device info not found"));
      const payload = {
        notification: {
          title: title,
          body: body,
        },
        token: device.fcmToken,
      };
      admin
        .messaging()
        .send(payload)
        .then(function (response) {
          Notification.create({
            sender: senderId,
            receiver: receiverId,
            message: body,
          })
            .then(() => {
              console.log("sent");
              console.log(response);
              resolutionFunc(response);
            })
            .catch((error) => rejectionFunc(error));
        })
        .catch(function (error) {
          rejectionFunc(error);
        });
    });
  });
}

exports.sendNotificaion = sendNotificaion;
