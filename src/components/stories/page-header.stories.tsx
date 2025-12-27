import type { Meta, StoryObj } from '@storybook/react';
import { PageHeader } from '../shared/page-header';

const meta: Meta<typeof PageHeader> = {
  title: 'Components/Shared/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    title: 'Dashboard',
    description: 'Welcome back to your rent management overview.',
  },
};

export const WithBreadcrumbs: Story = {
  args: {
    title: 'Inflow Records',
    description: 'Manage your incoming storage records.',
    breadcrumbs: [
      { label: 'Dashboard', href: '/' },
      { label: 'Inflow' },
    ],
  },
};

export const WithBackButton: Story = {
  args: {
    title: 'Customer Details',
    description: 'Viewing records for Siva.',
    backHref: '/customers',
  },
};
