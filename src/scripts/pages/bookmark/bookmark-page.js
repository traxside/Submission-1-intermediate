import BookMarkPresenter from './bookmark-presenter';
import Database from '../../data/database';
import { createStoryItemTemplate, showLoading } from '../../utils/index';

export default class BookmarkPage {
  #presenter;

  constructor() {
    this.#presenter = new BookMarkPresenter({
      view: this,
      model: Database
    });
  }

  async render() {
    return `
      <section class="container bookmark-page">
        <div class="bookmark-title-container">
          <h1 class="page-title">
            <i class="fas fa-bookmark"></i> Bookmarked Stories
          </h1>
        </div>
        <div id="bookmark-content" class="story-list-container">
          <div id="bookmark-list" class="story-list"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await this.#presenter.initializeBookmarkPage();
  }

  showLoading() {
    const bookmarkListContainer = document.getElementById('bookmark-list');
    showLoading(bookmarkListContainer);
  }

  showErrorMessage(message) {
    const bookmarkListContainer = document.getElementById('bookmark-list');
    bookmarkListContainer.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>${message}</p>
      </div>
    `;
  }

  showEmptyMessage() {
    const bookmarkListContainer = document.getElementById('bookmark-list');
    bookmarkListContainer.innerHTML = `
      <div class="empty-message">
        <i class="far fa-bookmark" style="font-size: 4rem; color: #ccc; margin-bottom: 1rem;"></i>
        <h3>No bookmarked stories yet</h3>
        <p style="font-size: 0.9rem; color: #666; margin-bottom: 1rem;">
          Stories you bookmark will appear here
        </p>
        <a href="#/" class="btn btn-primary">
          <i class="fas fa-home"></i> Browse Stories
        </a>
      </div>
    `;
  }

  showBookmarkedStories(stories) {
    const bookmarkListContainer = document.querySelector('#bookmark-list');


    const storiesHTML = stories
        .map(story => createStoryItemTemplate(story))
        .join('');

    bookmarkListContainer.innerHTML = storiesHTML;
  }

  showCountBookmark(stories) {
    const bookmarkTitleContainer = document.querySelector('.bookmark-title-container');
    // Add a header with count
    bookmarkTitleContainer.innerHTML += `
      <div class="bookmark-header">
        <p class="bookmark-count">
          <i class="fas fa-bookmark"></i> 
          ${stories.length} ${stories.length === 1 ? 'story' : 'stories'} bookmarked
        </p>
      </div>
    `;
  }

  // Cleanup method to be called when navigating away
  cleanup() {
    if (this.#presenter) {
      this.#presenter.cleanup();
    }
  }
}