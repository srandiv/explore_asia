export function bindContactForm(form, options = {}) {
  if (!form) return;

  const {
    popup,
    popupTitle,
    popupMessage,
    popupClose,
    submitButton,
    submitLabel,
    submitLabelDefault = "Send Inquiry",
    submitLabelSending = "Sending...",
  } = options;

  let popupTimer;

  const setPopup = (type, title, message) => {
    if (!popup || !popupTitle || !popupMessage) return;

    popup.dataset.status = type;
    popupTitle.textContent = title;
    popupMessage.textContent = message;
    popup.hidden = false;

    window.clearTimeout(popupTimer);
    popupTimer = window.setTimeout(() => {
      popup.hidden = true;
    }, 7000);
  };

  const setFieldErrors = (errors = {}) => {
    for (const field of form.querySelectorAll("[name]")) {
      field.removeAttribute("aria-invalid");
    }

    for (const fieldName of Object.keys(errors)) {
      const field = form.querySelector(`[name="${fieldName}"]`);
      field?.setAttribute("aria-invalid", "true");
    }
  };

  popupClose?.addEventListener("click", () => {
    popup.hidden = true;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFieldErrors();

    if (!form.checkValidity()) {
      form.reportValidity();
      setPopup("error", "Check the form", "Please fill all required fields correctly.");
      return;
    }

    submitButton?.setAttribute("disabled", "true");
    if (submitLabel) submitLabel.textContent = submitLabelSending;

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: {
          Accept: "application/json",
        },
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        setFieldErrors(result.errors);
        setPopup("error", "Message not sent", result.message || "Please try again in a moment.");
        return;
      }

      form.reset();
      setPopup("success", "Inquiry sent", result.message || "Thank you. Your inquiry was sent successfully.");
    } catch {
      setPopup("error", "Message not sent", "Please check your connection and try again.");
    } finally {
      submitButton?.removeAttribute("disabled");
      if (submitLabel) submitLabel.textContent = submitLabelDefault;
    }
  });
}
