// Smooth reveal on scroll for feature cards
const cards = document.querySelectorAll('.feature-card');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

cards.forEach((card) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(24px)';
  card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(card);
});

// Detect Touch device to disable heavy touch gesture move event listeners
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Viewport active observer for mobile autofocus & neon glow active state
const viewportObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        cards.forEach((c) => c.classList.remove('active-viewport'));
        entry.target.classList.add('active-viewport');
      } else {
        entry.target.classList.remove('active-viewport');
        if (isTouchDevice) {
          entry.target.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        }
      }
    });
  },
  { threshold: 0.55 } // Centered/mostly in viewport
);

cards.forEach((card) => viewportObserver.observe(card));

// Desktop 3D Card Hover Tilt and Glare
if (!isTouchDevice) {
  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s ease, border-color 0.3s ease, box-shadow 0.3s ease';
    });

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const px = (x / rect.width) - 0.5;
      const py = (y / rect.height) - 0.5;
      
      const rotateX = -py * 16;
      const rotateY = px * 16;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`;
      card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
      card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.5s ease, border-color 0.3s ease, box-shadow 0.3s ease';
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  });
}

// Mobile Auto-Breathing 3D Tilt Loop (Runs at 60 FPS natively via GPU transforms)
function animateMobileAutoTilt(time) {
  if (isTouchDevice && window.innerWidth < 992) {
    const activeCard = document.querySelector('.feature-card.active-viewport');
    if (activeCard) {
      const t = time * 0.0012;
      // Gentle sine-wave oscillation on mobile
      const rotateX = Math.sin(t) * 4.5; 
      const rotateY = Math.cos(t * 1.2) * 4.5;
      activeCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    }
  }
  requestAnimationFrame(animateMobileAutoTilt);
}
requestAnimationFrame(animateMobileAutoTilt);

// Desktop 3D Hero Showcase Card Interactions
const heroCard = document.querySelector('.hero-3d-card');
if (heroCard && !isTouchDevice) {
  heroCard.addEventListener('mouseenter', () => {
    heroCard.style.animation = 'none'; // pause float
    heroCard.style.transition = 'transform 0.1s ease, box-shadow 0.3s ease';
  });

  heroCard.addEventListener('mousemove', (e) => {
    const rect = heroCard.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const px = (x / rect.width) - 0.5;
    const py = (y / rect.height) - 0.5;
    
    const rotateX = -py * 18;
    const rotateY = px * 18;
    
    heroCard.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`;
  });

  heroCard.addEventListener('mouseleave', () => {
    heroCard.style.transition = 'transform 0.8s ease, box-shadow 0.3s ease';
    heroCard.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    setTimeout(() => {
      if (!heroCard.matches(':hover')) {
        heroCard.style.animation = 'heroFloat 7s ease-in-out infinite';
      }
    }, 800);
  });
}

// Navbar shadow on scroll
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    navbar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.55)';
  } else {
    navbar.style.boxShadow = 'none';
  }
});
