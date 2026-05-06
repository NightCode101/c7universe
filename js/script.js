// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
    initializeNavbar();
});

// Hamburger Menu Toggle
function initializeNavbar() {
    const toggle = document.getElementById('navbarToggle');
    const links = document.getElementById('navbarLinks');

    if (!toggle || !links) return;

    toggle.addEventListener('click', function() {
        toggle.classList.toggle('active');
        links.classList.toggle('active');
    });

    // Close menu when a link is clicked
    const navLinks = links.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            toggle.classList.remove('active');
            links.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.navbar')) {
            toggle.classList.remove('active');
            links.classList.remove('active');
        }
    });
}

// Initialize Chart.js - Admin Role Distribution
function initializeChart() {
    const ctx = document.getElementById('roleChart');

    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            // Updated roles to include Lead Dev
            labels: ['Creator', 'Lead Dev', 'Head Admin', 'Head Moderator', 'Moderator', 'Editor', 'Social Media'],
            datasets: [{
                // Added a '1' for Lead Dev position
                data: [1, 1, 4, 3, 3, 3, 2],
                backgroundColor: [
                    '#001A4D', /* Deep Space Navy (Creator) */
                    '#002B80', /* Dark Navy (Lead Dev) */
                    '#003399', /* Dark Blue (Head Admin) */
                    '#0052CC', /* Royal Blue (Head Mod) */
                    '#007FFF', /* Azure Blue (Moderator) */
                    '#00BFFF', /* Electric Sky Blue (Editor) */
                    '#80DFFF'  /* Soft Cyan (SocMed) */
                ],
                borderColor: '#FFFFFF',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            family: "'Poppins', sans-serif",
                            size: 14,
                            weight: '500'
                        },
                        color: '#2C3E50',
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                }
            }
        }
    });
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Add animation to elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeIn 0.8s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe team cards and sections
document.querySelectorAll('.team-card, .about__content, .join__content').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
});

// --- DP Blast Feature Logic ---
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('dpCanvas');
    if (!canvas) return; // Only run on the DP Blast page

    const ctx = canvas.getContext('2d');
    const imageUpload = document.getElementById('imageUpload');
    const zoomSlider = document.getElementById('zoomSlider');
    const zoomControl = document.getElementById('zoomControl');
    const downloadBtn = document.getElementById('downloadBtn');

    let frameImage = new Image();
    let userImage = new Image();
    let isUserImageLoaded = false;
    let frameBackgroundColor = '#87CEEB'; // Default background color for the frame

    // Image manipulation state
    let imgScale = 1;
    let imgX = 0;
    let imgY = 0;
    
    // Dragging state
    let isDragging = false;
    let startX, startY;

    // Load the frame (Ensure c7universe-frame.png exists in your assets folder)
    frameImage.src = 'assets/c7universe-frame.png';
    frameImage.onload = drawCanvas;

    // Handle Image Upload
    imageUpload.addEventListener('change', function(e) {
        const reader = new FileReader();
        reader.onload = function(event) {
            userImage.onload = function() {
                isUserImageLoaded = true;
                
                // Calculate initial scale to cover the canvas
                const scaleX = canvas.width / userImage.width;
                const scaleY = canvas.height / userImage.height;
                imgScale = Math.max(scaleX, scaleY); // Fill behavior
                
                // Center the image initially
                imgX = (canvas.width - userImage.width * imgScale) / 2;
                imgY = (canvas.height - userImage.height * imgScale) / 2;

                // Update UI
                zoomSlider.value = imgScale;
                zoomSlider.min = imgScale * 0.5; // Allow zooming out a bit
                zoomSlider.max = imgScale * 3;   // Allow zooming in 3x
                
                zoomControl.style.display = 'block';
                downloadBtn.disabled = false;
                
                drawCanvas();
            }
            userImage.src = event.target.result;
        }
        if(e.target.files[0]) {
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    // Handle Zoom
    zoomSlider.addEventListener('input', function() {
        const newScale = parseFloat(this.value);
        
        // Keep the image centered while zooming
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        imgX = centerX - (centerX - imgX) * (newScale / imgScale);
        imgY = centerY - (centerY - imgY) * (newScale / imgScale);
        imgScale = newScale;
        drawCanvas();
    });

    // Handle Panning (Mouse)
    canvas.addEventListener('mousedown', startDrag);
    canvas.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', endDrag);

    // Handle Panning (Touch for mobile)
    canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        startDrag({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: true });
    
    canvas.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault(); // Prevent scrolling while panning
        const touch = e.touches[0];
        drag({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: false });
    
    window.addEventListener('touchend', endDrag);

    function startDrag(e) {
        if (!isUserImageLoaded) return;
        isDragging = true;
        
        // Adjust coordinates based on canvas display size vs actual size
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        startX = e.clientX * scaleX - imgX;
        startY = e.clientY * scaleY - imgY;
    }

    function drag(e) {
        if (!isDragging) return;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        imgX = e.clientX * scaleX - startX;
        imgY = e.clientY * scaleY - startY;
        
        drawCanvas();
    }

    function endDrag() {
        isDragging = false;
    }

    // Main Draw Function
    function drawCanvas() {
        // 1. Fill background with primary color
        ctx.fillStyle = frameBackgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Draw User Image
        if (isUserImageLoaded) {
            ctx.drawImage(
                userImage,
                imgX,
                imgY,
                userImage.width * imgScale,
                userImage.height * imgScale
            );
        }

        // 3. Draw Frame on top
        if (frameImage.complete && frameImage.naturalWidth !== 0) {
            ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
        }
    }

    // Handle Download
    downloadBtn.addEventListener('click', function() {
        if (!isUserImageLoaded) return;

        const link = document.createElement('a');
        link.download = 'CloudHouseOG-DP.jpg';
        link.href = canvas.toDataURL('image/jpg');
        link.click();
    });
});