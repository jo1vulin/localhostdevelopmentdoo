// Typewriter effect for terminal lines
document.addEventListener('DOMContentLoaded', () => {
    initTypewriter();
    initContactButtons();
    initCopyButtons();
});

// Typewriter animation
function initTypewriter() {
    const lines = document.querySelectorAll('.terminal-line, .progress-bar');

    lines.forEach((line, index) => {
        const delay = parseInt(line.getAttribute('data-delay')) || index * 300;

        setTimeout(() => {
            if (line.classList.contains('progress-bar')) {
                line.style.opacity = '1';
            } else {
                line.style.opacity = '1';
            }
        }, delay);
    });
}

// Contact button interactions
function initContactButtons() {
    const contactButtons = document.querySelectorAll('.contact-btn');

    contactButtons.forEach(button => {
        button.addEventListener('click', () => {
            const method = button.getAttribute('data-method');
            toggleContactDetail(method);
        });
    });
}

function toggleContactDetail(method) {
    const detailId = `${method}-detail`;
    const detail = document.getElementById(detailId);

    if (!detail) return;

    // Hide all other details
    document.querySelectorAll('.contact-detail').forEach(d => {
        if (d.id !== detailId) {
            d.style.display = 'none';
        }
    });

    // Toggle current detail
    if (detail.style.display === 'none') {
        detail.style.display = 'block';
        detail.style.animation = 'fadeIn 0.3s forwards';
    } else {
        detail.style.display = 'none';
    }
}

// Copy to clipboard functionality
function initCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-btn');

    copyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const textToCopy = button.getAttribute('data-copy');
            copyToClipboard(textToCopy, button);
        });
    });
}

async function copyToClipboard(text, button) {
    try {
        await navigator.clipboard.writeText(text);
        showCopyFeedback(button);
    } catch (err) {
        // Fallback for older browsers
        fallbackCopyToClipboard(text, button);
    }
}

function fallbackCopyToClipboard(text, button) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        showCopyFeedback(button);
    } catch (err) {
        console.error('Failed to copy:', err);
    }

    document.body.removeChild(textArea);
}

function showCopyFeedback(button) {
    const originalText = button.textContent;
    button.textContent = '[copied!]';
    button.classList.add('copied');

    setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('copied');
    }, 2000);
}
