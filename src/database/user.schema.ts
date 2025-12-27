import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { buildImageUrl } from "src/helpers/common.helper";

export enum UserRole {
    USER = 'user',
    DRIVER = 'driver',
    ADMIN = 'admin',
}

export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
}

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: false, min: 3, max: 100 })
    full_name: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: false, max: 500 })
    address: string;

    @Prop({ required: false, max: 100 })
    city: string;

    // @Prop({ required: false, max: 100 })
    // state: string;

    @Prop({ required: false })
    phone_number: string;

    @Prop({ required: true })
    password: string; // hashed

    @Prop({
        required: true,
        enum: UserRole,
    })
    role: UserRole;

    @Prop({ required: false, min: 6, max: 6 })
    otp: string;

    @Prop({ required: false, enum: Gender })
    gender: Gender;

    @Prop({ default: false })
    is_verified: boolean;

    @Prop({ required: false, default: null })
    fcm_token: string

    @Prop({ required: false, default: true })
    is_notify: boolean;

    @Prop({ required: false, default: null })
    profile_picture: string;

    @Prop({ required: false, default: null })
    transport_operator_license: string;

    @Prop({ required: false, default: null })
    driver_license_front: string;

    @Prop({ required: false, default: null })
    driver_license_back: string;

    @Prop({ required: false, default: null })
    bank_statement: string;

    @Prop({ required: false, default: null })
    drivers_tag_license: string;

    @Prop({ required: false, default: null })
    id_card_front: string;

    @Prop({ required: false, default: null })
    id_card_back: string;

    @Prop({ required: false, default: null })
    vat_certificate: string;

    @Prop({ required: false, default: null })
    stripeCustomerId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('profile_picture_url').get(function () {
    return buildImageUrl('/user/profile-pictures', this.profile_picture);
});

UserSchema.virtual('transport_operator_license_url').get(function () {
    return buildImageUrl('/user/transport-operator-license', this.transport_operator_license);
});

UserSchema.virtual('driver_license_front_url').get(function () {
    return buildImageUrl('/user/driver-license', this.driver_license_front);
});

UserSchema.virtual('driver_license_back_url').get(function () {
    return buildImageUrl('/user/driver-license', this.driver_license_back);
});

UserSchema.virtual('bank_statement_url').get(function () {
    return buildImageUrl('/user/bank-statement', this.bank_statement);
});

UserSchema.virtual('drivers_tag_license_url').get(function () {
    return buildImageUrl('/user/drivers-tag-license', this.drivers_tag_license);
});

UserSchema.virtual('id_card_front_url').get(function () {
    return buildImageUrl('/user/id-card', this.id_card_front);
});

UserSchema.virtual('id_card_back_url').get(function () {
    return buildImageUrl('/user/id-card', this.id_card_back);
});

UserSchema.virtual('vat_certificate_url').get(function () {
    return buildImageUrl('/user/vat-certificate', this.vat_certificate);
});

UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });