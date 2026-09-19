"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Currency } from "@prisma/client";

import { createOpportunityFormAction, updateOpportunityFormAction } from "@/actions/opportunities";
import { Field, inputClassName } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { fieldError, useActionFeedback } from "@/lib/use-action-feedback";

export type OpportunityFormValues = {
  companyName: string;
  requestedAmount: string;
  currency: Currency;
  submissionDate: string;
  description: string;
};

const DESCRIPTION_MAX = 500;

export function OpportunityForm({
  mode,
  opportunityId,
  initial,
}: {
  mode: "create" | "edit";
  opportunityId?: string;
  initial?: OpportunityFormValues;
}) {
  const router = useRouter();
  const [description, setDescription] = useState(initial?.description ?? "");

  const action = mode === "create" ? createOpportunityFormAction : updateOpportunityFormAction;
  const { state, formAction } = useActionFeedback(action, {
    successMessage: mode === "create" ? "Opportunity created." : "Opportunity updated.",
    onSuccess: (data) => router.push(`/opportunities/${data.id}`),
  });

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {mode === "edit" ? <input type="hidden" name="id" value={opportunityId} /> : null}

      <Field id="companyName" label="Company name" error={fieldError(state, "companyName")}>
        <input
          id="companyName"
          name="companyName"
          type="text"
          defaultValue={initial?.companyName}
          required
          className={inputClassName(!!fieldError(state, "companyName"))}
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field id="requestedAmount" label="Requested amount" error={fieldError(state, "requestedAmount")}>
          <input
            id="requestedAmount"
            name="requestedAmount"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={initial?.requestedAmount}
            required
            className={inputClassName(!!fieldError(state, "requestedAmount"))}
          />
        </Field>

        <Field id="currency" label="Currency" error={fieldError(state, "currency")}>
          <select
            id="currency"
            name="currency"
            defaultValue={initial?.currency ?? Currency.USD}
            className={inputClassName(!!fieldError(state, "currency"))}
          >
            {Object.values(Currency).map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="submissionDate" label="Submission date" error={fieldError(state, "submissionDate")}>
        <input
          id="submissionDate"
          name="submissionDate"
          type="date"
          defaultValue={initial?.submissionDate}
          required
          className={inputClassName(!!fieldError(state, "submissionDate"))}
        />
      </Field>

      <Field
        id="description"
        label="Description"
        error={fieldError(state, "description")}
        hint={`${description.length}/${DESCRIPTION_MAX} characters`}
      >
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={DESCRIPTION_MAX}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className={inputClassName(!!fieldError(state, "description"))}
        />
      </Field>

      <div className="flex justify-end gap-3">
        <SubmitButton pendingLabel={mode === "create" ? "Creating…" : "Saving…"}>
          {mode === "create" ? "Create opportunity" : "Save changes"}
        </SubmitButton>
      </div>
    </form>
  );
}
