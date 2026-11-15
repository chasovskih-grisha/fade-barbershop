"use strict";
/**
 * FADE Reputation & Competitive Intelligence Engine
 * Handles review sentiment tracking, automated feedback loops, triage workflows,
 * Net Promoter Score (NPS) calculation, and local competitive benchmarking.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReputationEngine = void 0;
class ReputationEngine {
    reviews = [];
    competitors = [];
    /**
     * Analyzes text and extracts sentiment and thematic tags.
     */
    analyzeReviewText(comment, rating) {
        const lower = comment.toLowerCase();
        const tags = new Set();
        if (lower.includes('fade') || lower.includes('skin fade'))
            tags.add('fade');
        if (lower.includes('beard') || lower.includes('trim') || lower.includes('shave'))
            tags.add('beard');
        if (lower.includes('wait') || lower.includes('late') || lower.includes('time'))
            tags.add('wait_time');
        if (lower.includes('price') || lower.includes('expensive') || lower.includes('cost') || lower.includes('cheap'))
            tags.add('pricing');
        if (lower.includes('clean') || lower.includes('shop') || lower.includes('vibe'))
            tags.add('cleanliness');
        if (lower.includes('lineup') || lower.includes('edges'))
            tags.add('lineup');
        let sentiment = 'NEUTRAL';
        if (rating >= 4 || lower.includes('amazing') || lower.includes('best') || lower.includes('perfect') || lower.includes('great')) {
            sentiment = 'POSITIVE';
        }
        else if (rating <= 2 || lower.includes('worst') || lower.includes('terrible') || lower.includes('bad') || lower.includes('ruined')) {
            sentiment = 'NEGATIVE';
        }
        else {
            if (rating === 3)
                sentiment = 'NEUTRAL';
        }
        return { sentiment, tags: Array.from(tags) };
    }
    /**
     * Adds and processes a new review into the reputation system.
     */
    addReview(reviewInput) {
        const analysis = this.analyzeReviewText(reviewInput.comment, reviewInput.rating);
        const review = {
            ...reviewInput,
            sentiment: analysis.sentiment,
            tags: analysis.tags,
            responded: false
        };
        this.reviews.push(review);
        return review;
    }
    /**
     * Triggers automated feedback routing post-appointment.
     * Ratings < 4 trigger management alert (triage required).
     * Ratings >= 4 prompt public review link.
     */
    processPostAppointmentFeedback(clientId, barberId, rating, comment) {
        const review = this.addReview({
            id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            clientId,
            barberId,
            rating,
            comment,
            source: 'INTERNAL_APP',
            createdAt: new Date()
        });
        if (review.rating < 4 || review.sentiment === 'NEGATIVE') {
            return {
                action: 'MANAGEMENT_TRIAGE',
                message: `Alert: Low rating (${review.rating}/5) received from client ${clientId}. Routed to shop manager for urgent service recovery.`
            };
        }
        else {
            return {
                action: 'PUBLIC_REVIEW_PROMPT',
                message: `Thank you message triggered with Google/Yelp review link incentive for high satisfaction.`
            };
        }
    }
    /**
     * Marks a review as responded with optional note.
     */
    respondToReview(reviewId, responseNote) {
        const review = this.reviews.find(r => r.id === reviewId);
        if (!review)
            return false;
        review.responded = true;
        review.responseNote = responseNote;
        return true;
    }
    /**
     * Calculates Net Promoter Score (NPS) based on internal ratings (1-5 scale mapped to promoters 5, passives 4, detractors 1-3).
     */
    calculateNPS() {
        if (this.reviews.length === 0)
            return 0;
        let promoters = 0;
        let detractors = 0;
        for (const r of this.reviews) {
            if (r.rating === 5)
                promoters++;
            else if (r.rating <= 3)
                detractors++;
        }
        const score = ((promoters - detractors) / this.reviews.length) * 100;
        return Math.round(score * 100) / 100;
    }
    /**
     * Generates comprehensive reputation summary metrics.
     */
    getReputationSummary() {
        const totalReviews = this.reviews.length;
        if (totalReviews === 0) {
            return {
                totalReviews: 0,
                averageRating: 0,
                netPromoterScore: 0,
                sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
                unrespondedNegativeCount: 0,
                commonTags: []
            };
        }
        const sumRating = this.reviews.reduce((acc, r) => acc + r.rating, 0);
        const averageRating = Math.round((sumRating / totalReviews) * 100) / 100;
        let positive = 0, neutral = 0, negative = 0, unrespondedNegativeCount = 0;
        const tagCounts = {};
        for (const r of this.reviews) {
            if (r.sentiment === 'POSITIVE')
                positive++;
            else if (r.sentiment === 'NEUTRAL')
                neutral++;
            else {
                negative++;
                if (!r.responded)
                    unrespondedNegativeCount++;
            }
            for (const t of r.tags) {
                tagCounts[t] = (tagCounts[t] || 0) + 1;
            }
        }
        const commonTags = Object.entries(tagCounts)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count);
        return {
            totalReviews,
            averageRating,
            netPromoterScore: this.calculateNPS(),
            sentimentBreakdown: { positive, neutral, negative },
            unrespondedNegativeCount,
            commonTags
        };
    }
    /**
     * Sets or updates local competitor benchmark data.
     */
    setCompetitors(competitors) {
        this.competitors = competitors;
    }
    /**
     * Performs local competitive benchmarking analysis.
     */
    benchmarkAgainstMarket() {
        const summary = this.getReputationSummary();
        const respondedCount = this.reviews.filter(r => r.responded).length;
        const shopResponseRate = summary.totalReviews > 0 ? Math.round((respondedCount / summary.totalReviews) * 100) : 0;
        const allShops = [
            ...this.competitors,
            {
                competitorName: 'FADE Barbershop',
                averageRating: summary.averageRating,
                totalReviews: summary.totalReviews,
                averageFadePrice: 45,
                responseRate: shopResponseRate
            }
        ];
        // Sort by rating descending, then review count descending
        allShops.sort((a, b) => {
            if (b.averageRating !== a.averageRating)
                return b.averageRating - a.averageRating;
            return b.totalReviews - a.totalReviews;
        });
        const rank = allShops.findIndex(s => s.competitorName === 'FADE Barbershop') + 1;
        const marketAverageRating = allShops.reduce((acc, s) => acc + s.averageRating, 0) / allShops.length;
        const marketAverageReviews = allShops.reduce((acc, s) => acc + s.totalReviews, 0) / allShops.length;
        const marketLeader = allShops[0].competitorName;
        const advantages = [];
        if (summary.averageRating >= marketAverageRating) {
            advantages.push('Above market average star rating.');
        }
        if (shopResponseRate > 80) {
            advantages.push('Exceptional customer review response rate.');
        }
        if (summary.sentimentBreakdown.negative === 0) {
            advantages.push('Zero unaddressed negative feedback in current period.');
        }
        return {
            shopAverageRating: summary.averageRating,
            shopTotalReviews: summary.totalReviews,
            shopResponseRate,
            marketAverageRating: Math.round(marketAverageRating * 100) / 100,
            marketAverageReviews: Math.round(marketAverageReviews),
            marketLeader,
            ratingRank: rank > 0 ? rank : 1,
            competitiveAdvantageNotes: advantages
        };
    }
}
exports.ReputationEngine = ReputationEngine;
