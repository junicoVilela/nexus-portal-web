import type { Meta, StoryObj } from '@storybook/angular';
import { SkeletonComponent } from './skeleton.component';

const meta: Meta<SkeletonComponent> = {
  title: 'Shared/UI/Skeleton',
  component: SkeletonComponent,
  tags: ['autodocs'],
  argTypes: {
    shape: { control: 'select', options: ['line', 'block', 'circle'] },
    width: { control: 'text' },
    height: { control: 'text' },
  },
  args: { shape: 'line', width: '240px', height: '14px' },
  render: args => ({
    props: args,
    template: `<ui-skeleton [shape]="shape" [width]="width" [height]="height" />`,
  }),
};
export default meta;

type Story = StoryObj<SkeletonComponent>;

export const Line: Story = {};
export const Block: Story = { args: { shape: 'block', width: '320px', height: '120px' } };
export const Circle: Story = { args: { shape: 'circle', width: '40px', height: '40px' } };
