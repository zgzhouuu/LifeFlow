/**
 * Navigation Component
 * Provides top navigation bar with logo, site name, nav links, and user avatar
 */
class Navigation {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.activeSection = 'home';
  }

  /**
   * Render the navigation bar
   */
  render() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`Container with id "${this.containerId}" not found`);
      return;
    }

    const navHTML = `
      <nav class="navigation">
        <div class="nav-container">
          <div class="nav-brand">
            <div class="nav-logo">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2"/>
                <path d="M16 8V16L20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="nav-site-name">LifeFlow</span>
          </div>
          
          <ul class="nav-links">
            <li><a href="#home" class="nav-link active" data-section="home">首页</a></li>
            <li><a href="#life" class="nav-link" data-section="life">生活</a></li>
            <li><a href="#exercise" class="nav-link" data-section="exercise">运动</a></li>
            <li><a href="#learning" class="nav-link" data-section="learning">学习</a></li>
          </ul>
          
          <div class="nav-user">
            <div class="user-avatar-placeholder">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2"/>
                <circle cx="16" cy="13" r="5" stroke="currentColor" stroke-width="2"/>
                <path d="M6 26C6 21 10 18 16 18C22 18 26 21 26 26" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </nav>
    `;

    this.container.innerHTML = navHTML;
    this.attachScrollListeners();
    this.setupScrollObserver();
  }

  /**
   * Attach click handlers to navigation links
   */
  attachScrollListeners() {
    const navLinks = this.container.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.getAttribute('data-section');
        this.smoothScrollTo(sectionId);
        this.setActiveLink(sectionId);
      });
    });
  }

  /**
   * Smooth scroll to a section and activate it
   * @param {string} sectionId - The ID of the section to scroll to
   */
  smoothScrollTo(sectionId) {
    const targetElement = document.getElementById(sectionId);
    
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      
      // Trigger function card activation for non-home sections
      if (sectionId !== 'home' && window.app && window.app.components && window.app.components.functionCards) {
        // Wait for scroll to complete, then activate the card
        setTimeout(() => {
          window.app.components.functionCards.switchActiveCard(sectionId);
        }, 500);
      }
    }
  }

  /**
   * Set active link in navigation
   * @param {string} sectionId - The ID of the active section
   */
  setActiveLink(sectionId) {
    const navLinks = this.container.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      if (link.getAttribute('data-section') === sectionId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    
    this.activeSection = sectionId;
  }

  /**
   * Setup intersection observer to highlight active section
   */
  setupScrollObserver() {
    const sections = document.querySelectorAll('section[id]');
    
    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.highlightActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach(section => {
      observer.observe(section);
    });
  }

  /**
   * Highlight the active section in navigation
   * @param {string} sectionId - The ID of the section currently in view
   */
  highlightActiveSection(sectionId) {
    if (this.activeSection !== sectionId) {
      this.setActiveLink(sectionId);
    }
  }
}

// Export for use in other modules
export { Navigation };
