import {sqliteTable,text,integer,index,primaryKey} from 'drizzle-orm/sqlite-core';
export const reviews=sqliteTable('reviews',{
 session:text('session').notNull(),emailId:text('email_id').notNull(),result:text('result').notNull(),revision:integer('revision').notNull(),updatedAt:text('updated_at').notNull(),
},t=>[primaryKey({columns:[t.session,t.emailId]})]);
export const audit=sqliteTable('audit',{
 id:text('id').primaryKey(),session:text('session').notNull(),emailId:text('email_id'),action:text('action').notNull(),actor:text('actor').notNull(),note:text('note').notNull(),details:text('details').notNull(),createdAt:text('created_at').notNull(),
},t=>[index('idx_audit_session_created').on(t.session,t.createdAt)]);
