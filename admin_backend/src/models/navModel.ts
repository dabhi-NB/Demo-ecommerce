import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INavItem extends Document {
    label: string;
    url: string;
    icon?: string;
    order: number;
    isActive: boolean;
    isExternal: boolean;
    openInNewTab: boolean;
    parent: Types.ObjectId | null;
    location: 'header' | 'footer' | 'sidebar';
    visibleTo: 'all' | 'guest' | 'user'; // who sees this item
    createdAt?: Date;
    updatedAt?: Date;
}

const NavItemSchema: Schema = new Schema(
    {
        label: { type: String, required: true, trim: true },
        url: { type: String, required: true, trim: true },
        icon: { type: String, default: '' },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        isExternal: { type: Boolean, default: false },
        openInNewTab: { type: Boolean, default: false },
        parent: { type: Schema.Types.ObjectId, ref: 'NavItem', default: null },
        location: {
            type: String,
            enum: ['header', 'footer', 'sidebar'],
            default: 'header',
        },
        visibleTo: {
            type: String,
            enum: ['all', 'guest', 'user'],
            default: 'all',
        },
    },
    {
        collection: 'nav_items',
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

NavItemSchema.virtual('children', {
    ref: 'NavItem',
    localField: '_id',
    foreignField: 'parent',
});

NavItemSchema.index({ location: 1, order: 1 });

export default mongoose.models.NavItem || mongoose.model<INavItem>('NavItem', NavItemSchema);