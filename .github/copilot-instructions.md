# GitHub Copilot PR Review Instructions

This document provides guidelines for GitHub Copilot when reviewing pull request changes in this repository. The review should prioritize critical issues first, then offer general improvement suggestions. **All actual review comments must be in Spanish**, even though this instruction file is written in English. Copilot should also limit its analysis to the code **changes in the pull request** (do not comment on untouched code).

## Critical Error Detection (Priority 1)

When performing a code review, Copilot should **first check for critical errors or pitfalls** in the changes:

- **TypeScript Non-Null Assertions (`!`)**: Identify any instances of the non-null assertion operator (e.g. `element!.property`). Verify that there are proper null-checks or other guarantees that the value is not `null`/`undefined` before using `!`. If no such safety is in place, flag this as a dangerous operation that could cause runtime errors.

- **Supabase Migration Issues**: If the PR includes database migration files (SQL for Supabase), review them carefully for anything that might break database integrity or security:
  - Ensure **Row-Level Security (RLS)** policies are not accidentally broken or removed. Adding new tables should typically include new RLS policies; dropping or altering tables/columns should not disable existing necessary policies.
  - Look for **relation conflicts**, such as dropping a column or table that other tables or functions depend on (e.g. foreign key relations or views). Flag changes that might cause referential integrity issues.
  - Avoid **dropping important constraints** without replacement. For example, check if a migration drops a foreign key, unique constraint, or index that is needed. Such changes should be intentional and reviewed for impact on data consistency.
  - Confirm that any changes to authentication-related tables or policies won’t inadvertently bypass security (since Supabase heavily relies on RLS for data protection).

- **Next.js Build/Runtime Pitfalls**: Focus on any modifications that could affect the Next.js 15 App Router application:
  - Review changes in **Next.js configuration** (e.g. `next.config.ts`). Misconfigurations here could lead to build failures or improper asset handling. Flag unknown or deprecated config options, or missing required settings.
  - Check usage of **App Router features**. If the code uses `next/navigation` (for example, `useRouter` or `useSearchParams` from Next.js), ensure these are used correctly (e.g. only inside Client Components with `"use client"` when needed). If the PR moves or adds pages in the `app/` directory, verify the structure (folder names, `layout.tsx`, `page.tsx` files) follows Next.js conventions to avoid runtime routing errors.
  - Verify **dynamic route handling**. For any new or changed dynamic routes (e.g. files like `[id].tsx` or `[...slug]` catch-alls), ensure they are implemented properly. Check that any links or navigations to these routes are updated and that there's no mismatch in route parameters that would cause 404 errors.
  - Ensure **environment variables** are handled correctly. If the code introduces or uses environment variables, confirm that anything used on the client side is prefixed with `NEXT_PUBLIC_`. Also ensure that any required env vars for build or runtime are documented or checked (missing env variables can cause runtime crashes). If a new variable is critical and not optional, there should be validation or a fallback to prevent deployment issues.

If any of the above critical issues are found, **Copilot should prioritize commenting on those in the PR (in Spanish)**, as they represent potential bugs or breaking problems.

## Best Practice Suggestions (If No Critical Issues Found)

If the review does not uncover serious errors, Copilot should then provide general code improvement suggestions. These can help maintain code quality and consistency. Focus on the following areas (always keeping the feedback constructive and in Spanish):

- **TypeScript Typing**: Recommend improvements to type safety. For example, avoid using `any` or overly broad types if possible, prefer explicit interfaces/types. If you see an opportunity to use more specific types, generics, or utility types to make the code more robust, mention it. Ensure function return types are correctly annotated and that types reflect the actual data (especially for external data like Supabase responses).

- **Async/Await and Promise Handling**: Check the use of async functions and promises. Ensure that `async/await` is used consistently (avoid mixing `.then()` with `await` in the same scope). Suggest adding error handling for promises (try/catch around awaited calls) if missing. If a function can fail or throw, encourage handling that (or propagating errors properly). Also, verify that there are no unawaited promises that could lead to race conditions or ignored rejections.

- **React Hooks and Component Practices**: Ensure that React (Next.js) components follow best practices. For instance, verify the **Rules of Hooks** are not violated (hooks called conditionally or in loops, which would be an error). Check dependency arrays for hooks like `useEffect` or `useMemo` – if something is missing or extraneous, suggest corrections. Also, ensure state and effect usage is appropriate (e.g. not unnecessarily storing derived values in state, etc.). If a new component is added, consider if it should be a **Server Component** or **Client Component** and whether `"use client"` is correctly applied where needed.

- **Separation of Concerns & Organization**: Look at the code structure for clarity. If a function or component is doing too many things, you might suggest breaking it into smaller units (for example, a large component could be split into sub-components for readability). Ensure that business logic is separated from presentation where possible (for instance, heavy data processing might belong in a utility or API route rather than in a React component). If you see duplicated code, you could suggest refactoring into a shared helper. These suggestions should be made only when it clearly improves maintainability without introducing risk.

- **Code Clarity and Simplification**: Offer pointers to simplify or clarify the code if applicable. This could include using more descriptive variable or function names, adding comments where the code is complex, or using language features to shorten code (e.g. using array methods instead of loops, using optional chaining instead of nested ifs for null checks, etc.). Ensure any suggestions are in line with the project’s coding style. For example, if a piece of logic is overly complex or uses a nested ternary, consider suggesting a clearer if/else structure for better readability. Always frame these as suggestions, not mandates, and keep the tone positive.

## Review Language (Spanish)

All feedback and comments that Copilot provides in the pull request **must be in Spanish**. Even though this instruction document is in English, the team expects the code review comments in PRs to be written in Spanish. Use clear, professional Spanish appropriate for technical feedback. (For instance, instead of "You should add a null check here," say _"Deberías agregar una verificación de null aquí."_) Ensure the tone remains helpful and instructive.

## Scope: Only Changed Files

Copilot should **only analyze and comment on the files that were modified in the pull request**. Do not provide feedback on parts of the codebase that are unchanged or outside the diff of the PR. The review should stay focused on the introduced changes. This means:

- Only point out issues or suggestions in lines/code that are added or edited by the PR.
- If an existing issue is noticed outside the changed lines, it should generally be ignored (unless it’s directly relevant to understanding the change). The goal is to keep the review scoped to the PR’s changes so as not to overwhelm with unrelated commentary.

## Project Context

Keep the following project-specific context in mind during the review. This repository uses certain technologies and patterns which may influence what is considered best practice or an issue:

- **Next.js 15 (App Router)**: The project is built with Next.js v15 using the App Router (the `app/` directory for routing). This means the code leverages React 18 features, server components, and client components. Be mindful that some patterns are different from older Next.js (Pages Router) apps. Ensure that recommendations align with Next’s App Router conventions. For example, using `useRouter` from `next/navigation` is correct (instead of `next/router`), and file-based routing (with `layout.tsx`, `page.tsx`, etc.) is in use.

- **TypeScript**: The codebase is entirely in TypeScript. Types are important for catching errors. The presence of TypeScript also means that certain JavaScript issues (like undeclared variables) are less likely, but type-related issues (like incorrect types or any-casting) are more relevant. Tailor feedback to encourage strong typing and proper interface definitions as needed.

- **Supabase with RLS**: The application uses Supabase (PostgreSQL) as its database, and Row-Level Security (RLS) is enabled. Migrations are used to evolve the database schema. When reviewing database-related code or SQL migration files, remember that every table with RLS requires appropriate policies for read/write. If a migration adds a new table or changes a table, ensure that corresponding RLS policies are added or updated accordingly in the SQL (or that the team is at least aware to handle it). Also, Supabase’s schema includes auth tables and possibly storage; be cautious if the PR touches those. The review should catch any changes that might inadvertently open security holes or break database relations.

- **Tailwind CSS for Styling**: The project uses Tailwind CSS for UI styling. This means you will see lots of utility classes in JSX (e.g. `className="px-4 py-2 text-center ..."`). This is normal and usually not something to critique unless the classes are clearly wrong or conflicting. Only flag styling issues if they would cause a visual bug or if there is clear misuse of classes (like a class that doesn’t exist or a redundant combination). In general, focus more on functionality unless a style change in the PR might break layout or theme consistency.

- **Radix UI-based Component System**: The UI components are built on top of Radix UI (a library of accessible, unstyled components). This means the code may include Radix primitives and patterns (e.g. `@radix-ui/react-dialog` components, or data attributes like `data-state="open"` on elements, etc.). These are expected in this codebase. Copilot should recognize common Radix UI usage and not flag it as an error. For example, multiple nested elements for a dialog or dropdown might be required by Radix’s structure. Only provide feedback on Radix-based components if the PR’s changes break their intended usage (like missing required props or event handlers). Otherwise, assume that Radix UI patterns are intentional. Familiarity with Radix’s API is helpful – e.g., knowing that Radix UI components often come with preset aria attributes and context providers.

By following these guidelines, GitHub Copilot’s code review comments will be more aligned with the project’s needs. **Priority should always be given to critical errors or bugs**, and then to helping improve code quality. All of this should be done in a supportive tone and in Spanish.
