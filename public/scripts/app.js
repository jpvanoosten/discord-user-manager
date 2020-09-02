$(document).ready(function () {
  //#region Form validation.
  $.validator.setDefaults({
    rules: {
      username: {
        required: true,
        minlength: 4,
      },
      name: {
        required: true,
        minlength: 4,
      },
      password: {
        required: true,
        minlength: 8,
      },
    },
    messages: {
      username: {
        required: "Username is required.",
        minlength: $.validator.format("Username must be at least {0} characters long."),
      },
      name: {
        required: "Name is required.",
        minlength: $.validator.format("Name must be at least {0} characters long."),
      },
      password: {
        required: "Password cannot be empty.",
        minlength: $.validator.format("Password must be at least {0} charaters long."),
      },
    },
    errorClass: "invalid-feedback",
    highlight: function (element) {
      $(element).removeClass("is-valid").addClass("is-invalid");
    },
    unhighlight: function (element) {
      $(element).removeClass("is-invalid").addClass("is-valid");
    },
    errorPlacement: function (error, element) {
      if (element.attr("name") === "password") {
        error.insertAfter(element.parent());
      } else {
        error.insertAfter(element);
      }
    },
  });

  $("#addUserModal form").validate({
    submitHandler: function (form) {
      console.log("Form submitted.");
      form.submit();
      $("#addUserModal").modal("hide");
    },
  });

  $("#editUserModal form").validate({
    rules: {
      password: {
        required: false, // Passwords are not required when editing a user.
        minlength: 8,
      },
    },
    submitHandler: function (form) {
      console.log("Form submitted.");
      form.submit();
      $("#editUserModal").modal("hide");
    },
  });

  // The delete user modal doesn't have any validation, but
  // we still need to hide the modal when the form is submitted.
  $("#deleteUserModal form").submit(function () {
    $("#deleteUserModal").modal("hide");
  });

  //#endregion

  //#region Generate a random password
  /**
   * Generates a random password.
   * @param {number} length The length of the password to generate.
   * @returns A randomly generated password of `length` characters.
   */
  function GenerateRandomPassword(length) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    const password = Array(length)
      .fill(chars)
      .map((c) => {
        return c[Math.floor(Math.random() * c.length)];
      })
      .join("");

    return password;
  }

  // "Generate password" button click event:
  $("form [name=generatePassword]").click(function () {
    // Get the closest password field.
    var password = $(this).parentsUntil("form").find("[name=password]");
    // Use the data-passwordlength attribute on the button if it is specified.
    var passwordLength = $(this).data("passwordlength") || 8;
    var newPassword = GenerateRandomPassword(passwordLength);
    password.val(newPassword);

    // Update field validation.
    password.valid();

    // Change the input field to text so we can read the randomly changed password.
    password.prop("type", "text"); // I've read somewhere that this won't work in IE <= 8?
  });
  //#endregion

  //#region Tooltips.
  $("[data-tooltip='true']").tooltip({
    trigger: "hover", // This breaks tootips on mobile but it's better than having the tootip appear over the modal.
  });
  // Hide the tooltip if the button is clicked.
  $("[data-tooltip='true']").on("click", function () {
    $(this).tooltip("hide");
  });
  //#endregion

  //#region Alerts.
  // Alerts "slide up" when closed.
  $(".alert").on("close.bs.alert", function (event) {
    event.preventDefault();
    event.stopPropagation();

    var alert = $(this).closest(".alert");
    alert.animate(
      {
        top: -alert.outerHeight(),
        opacity: 0,
      },
      "slow",
      function () {
        $(this).remove();
      }
    );
  });

  // Automatically close the alert after a few seconds.
  setTimeout(function () {
    $(".alert").alert("close");
  }, 5000);
  //#endregion
});
