import type { Meta, StoryObj } from '@storybook/react';
import { SubmitButton } from '../ui/submit-button';

const meta: Meta<typeof SubmitButton> = {
  title: 'Components/UI/SubmitButton',
  component: SubmitButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
        control: 'select',
        options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']
    }
  }
};

export default meta;
type Story = StoryObj<typeof SubmitButton>;

export const Default: Story = {
  args: {
    children: 'Process Request',
  },
};

export const Loading: Story = {
  args: {
    children: 'Loading...',
    // Note: pending state usually comes from useFormStatus, so we'd need a decorator to mock it properly 
    // for a true interactive "loading" story in a pure component environment.
  },
};

export const Destructive: Story = {
  args: {
    children: 'Delete Item',
    variant: 'destructive',
  },
};
