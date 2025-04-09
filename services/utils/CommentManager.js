class CommentManager {
  constructor(db, keywordManager) {
    this.db = db;
    this.collection = db.collection(process.env.MONGO_COLLECTION || 'comments');
    this.keywordManager = keywordManager;
  }

  // Get all comments for a post, handling pagination
  async getAllComments(post, fbPromise) {
    try {
      if (!post.comments) {
        return [];
      }
      
      let comments = post.comments.data;
      let nextPage = post.comments.paging ? post.comments.paging.next : null;
      
      // Handle pagination to get all comments
      while (nextPage) {
        try {
          // Extract the relative path from the full URL
          const url = new URL(nextPage);
          const path = url.pathname + url.search;
          
          const nextComments = await fbPromise('get', path);
          comments = comments.concat(nextComments.data);
          nextPage = nextComments.paging ? nextComments.paging.next : null;
        } catch (error) {
          console.error('Error fetching next page of comments:', error);
          break;
        }
      }
      
      return comments;
    } catch (error) {
      console.error('Error getting all comments:', error);
      return [];
    }
  }

  // Process comments and save Avon-related comments to MongoDB
  async processComments(commentsData, postId, pageId) {
    try {
      if (!commentsData || commentsData.length === 0) {
        return 0;
      }
      
      // Get existing comment IDs to avoid duplicates
      const existingCommentIds = await this.collection
        .find({ post_id: postId })
        .project({ comment_id: 1 })
        .toArray();
      
      const existingCommentIdSet = new Set(existingCommentIds.map(c => c.comment_id));
      
      let savedCount = 0;
      let newCommentsCount = 0;
      
      for (const comment of commentsData) {
        // Skip if comment already exists in the database
        if (existingCommentIdSet.has(comment.id)) {
          continue;
        }
        
        newCommentsCount++;
        
        // Check if comment is Avon-related
        if (this.keywordManager.isAvonRelated(comment.message)) {
          // Prepare document for MongoDB
          const commentDoc = {
            comment_id: comment.id,
            post_id: postId,
            page_id: pageId,
            message: comment.message,
            created_time: new Date(comment.created_time),
            from_id: comment.from ? comment.from.id : null,
            from_name: comment.from ? comment.from.name : null,
            scraped_at: new Date()
          };
          
          // Insert comment in MongoDB
          await this.collection.insertOne(commentDoc);
          savedCount++;
        }
      }
      
      console.log(`Processed ${newCommentsCount} new comments for post ${postId}, saved ${savedCount} Avon-related comments`);
      return savedCount;
    } catch (error) {
      console.error(`Error processing comments for post ${postId}:`, error);
      return 0;
    }
  }

  // Save all comments for a post regardless of their content
  async saveAllComments(commentsData, postId, pageId) {
    try {
      if (!commentsData || commentsData.length === 0) {
        return 0;
      }
      
      // Get existing comment IDs to avoid duplicates
      const existingCommentIds = await this.collection
        .find({ post_id: postId })
        .project({ comment_id: 1 })
        .toArray();
      
      const existingCommentIdSet = new Set(existingCommentIds.map(c => c.comment_id));
      
      let savedCount = 0;
      let newCommentsCount = 0;
      
      for (const comment of commentsData) {
        // Skip if comment already exists in the database
        if (existingCommentIdSet.has(comment.id)) {
          continue;
        }
        
        newCommentsCount++;
        
        // Prepare document for MongoDB
        const commentDoc = {
          comment_id: comment.id,
          post_id: postId,
          page_id: pageId,
          message: comment.message,
          created_time: new Date(comment.created_time),
          from_id: comment.from ? comment.from.id : null,
          from_name: comment.from ? comment.from.name : null,
          scraped_at: new Date(),
          contains_keywords: this.keywordManager.isAvonRelated(comment.message || '')
        };
        
        // Insert comment in MongoDB
        await this.collection.insertOne(commentDoc);
        savedCount++;
      }
      
      console.log(`Processed ${newCommentsCount} new comments for post ${postId}, saved ${savedCount} comments`);
      return savedCount;
    } catch (error) {
      console.error(`Error saving comments for post ${postId}:`, error);
      return 0;
    }
  }
}

module.exports = CommentManager;
