$(document).ready(function () {
  $("#addUserModal form").validate({
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
        minlength: jQuery.validator.format("Username must be at least {0} characters long."),
      },
      name: {
        required: "Name is required.",
        minlength: jQuery.validator.format("Name must be at least {0} characters long."),
      },
      password: {
        required: "Password cannot be empty.",
        minlength: jQuery.validator.format("Password must be at least {0} charaters long."),
      },
    },
    submitHandler: function (form) {
      console.log("Form submitted.");
      form.submit();
      $("#addUserModal").modal("hide");
    },
  });
});
