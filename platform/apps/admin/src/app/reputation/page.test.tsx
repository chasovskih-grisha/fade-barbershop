import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReputationDashboard from './page';

describe('ReputationDashboard', () => {
  it('renders reputation summary metrics and reviews list', () => {
    render(<ReputationDashboard />);

    expect(screen.getByText('Reputation & Competitive Intelligence')).toBeInTheDocument();
    expect(screen.getByText(/Customer Feedback & Sentiment Stream/i)).toBeInTheDocument();
    expect(screen.getByText('Alexander Wright')).toBeInTheDocument();
    expect(screen.getByText('Viktor Hnativ')).toBeInTheDocument();
  });

  it('filters reviews by sentiment', () => {
    render(<ReputationDashboard />);

    const positiveButton = screen.getByRole('button', { name: 'Positive' });
    fireEvent.click(positiveButton);

    expect(screen.getByText('Alexander Wright')).toBeInTheDocument();
    expect(screen.queryByText('Viktor Hnativ')).not.toBeInTheDocument();
  });

  it('allows opening reply box and responding to a review', () => {
    render(<ReputationDashboard />);

    // Find first 'Reply & Resolve' button (for unreplied reviews)
    const replyButtons = screen.getAllByRole('button', { name: 'Reply & Resolve' });
    fireEvent.click(replyButtons[0]!);

    const textarea = screen.getByPlaceholderText(
      /Write a professional response or click AI Auto-Reply Assistant.../i
    );
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: 'Thank you for your feedback!' } });

    const sendButton = screen.getByRole('button', { name: 'Send Response' });
    fireEvent.click(sendButton);

    expect(screen.getAllByText('✓ Replied & Resolved').length).toBeGreaterThan(0);
  });

  it('triggers AI Auto-Reply Assistant', () => {
    render(<ReputationDashboard />);

    const replyButtons = screen.getAllByRole('button', { name: 'Reply & Resolve' });
    fireEvent.click(replyButtons[0]!);

    const aiButton = screen.getByRole('button', { name: /AI Auto-Reply Assistant/i });
    expect(aiButton).toBeInTheDocument();

    fireEvent.click(aiButton);

    const textarea = screen.getByPlaceholderText(
      /Write a professional response or click AI Auto-Reply Assistant.../i
    ) as HTMLTextAreaElement;
    expect(textarea.value.length).toBeGreaterThan(10);
  });

  it('renders strategic competitor action plan and sentiment alert rules', () => {
    render(<ReputationDashboard />);

    expect(screen.getByText('🎯 Strategic Competitor Action Plan')).toBeInTheDocument();
    expect(screen.getByText('⚡ Sentiment Alert Rules')).toBeInTheDocument();
    expect(screen.getByText('Critical Low Rating (<= 2)')).toBeInTheDocument();
  });

  it('renders competitor pricing matrix and sentiment trend forecast', () => {
    render(<ReputationDashboard />);

    expect(screen.getByText('🏷️ Competitor Pricing & Positioning Matrix')).toBeInTheDocument();
    expect(screen.getByText('📈 Review Sentiment Trend & Loyalty Forecast')).toBeInTheDocument();
    expect(screen.getByText('Positioning Category:')).toBeInTheDocument();
    expect(screen.getByText('Brand Loyalty Score:')).toBeInTheDocument();
  });
});
