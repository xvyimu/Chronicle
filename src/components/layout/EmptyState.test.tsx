import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders the title as a status message', () => {
    render(<EmptyState title="暂无内容" />);
    expect(screen.getByRole('status')).toHaveTextContent('暂无内容');
  });

  it('renders optional description and action', () => {
    render(
      <EmptyState
        title="暂无文章"
        description="稍后再来看看"
        action={<button type="button">重新加载</button>}
      />,
    );

    expect(screen.getByText('稍后再来看看')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重新加载' })).toBeInTheDocument();
  });
});
