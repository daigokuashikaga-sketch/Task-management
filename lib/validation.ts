import { z } from "zod";
import { TASK_PRIORITIES, TASK_STATUSES } from "./types";

/**
 * 入力検証スキーマ。API 境界で外部入力を必ず通すことで、
 * 不正なデータがドメイン／永続化層へ流れ込むのを防ぐ。
 */

const isoDate = z
  .string()
  .datetime({ message: "期限は ISO 8601 形式で指定してください" })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "期限は YYYY-MM-DD 形式で指定してください"));

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "タイトルは必須です")
    .max(200, "タイトルは 200 文字以内で入力してください"),
  description: z.string().trim().max(2000, "説明は 2000 文字以内で入力してください").optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  tags: z
    .array(z.string().trim().min(1).max(30, "タグは 30 文字以内で入力してください"))
    .max(10, "タグは 10 個までです")
    .transform((tags) => [...new Set(tags)])
    .optional(),
  dueDate: isoDate.nullable().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "更新する項目を 1 つ以上指定してください" },
);

export const taskFilterSchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  search: z.string().trim().max(200).optional(),
  tag: z.string().trim().max(30).optional(),
});

/** ユーザー登録の入力検証。 */
export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "メールアドレスは必須です")
    .email("メールアドレスの形式が正しくありません")
    .max(254, "メールアドレスが長すぎます"),
  password: z
    .string()
    .min(8, "パスワードは 8 文字以上で入力してください")
    .max(128, "パスワードは 128 文字以内で入力してください"),
  name: z.string().trim().max(80, "名前は 80 文字以内で入力してください").optional(),
});

export type CreateTaskBody = z.infer<typeof createTaskSchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskSchema>;
export type RegisterBody = z.infer<typeof registerSchema>;
