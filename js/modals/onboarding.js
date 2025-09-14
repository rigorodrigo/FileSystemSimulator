const onboardingModal = document.getElementById('onboarding');

if (onboardingModal) {
    onboardingModal.addEventListener(`keydown`, (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            // Prevent closing the modal with Escape
        }
    });
} 