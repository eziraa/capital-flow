"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Currency } from "@prisma/client";

import { createOpportunityFormAction, updateOpportunityFormAction } from "@/actions/opportunities";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
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

      <FormField id="companyName" label="Company name" error={fieldError(state, "companyName")}>
        <Input
          id="companyName"
          name="companyName"
          type="text"
          defaultValue={initial?.companyName}
          required
          aria-invalid={!!fieldError(state, "companyName")}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField id="requestedAmount" label="Requested amount" error={fieldError(state, "requestedAmount")}>
          <Input
            id="requestedAmount"
            name="requestedAmount"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={initial?.requestedAmount}
            required
            aria-invalid={!!fieldError(state, "requestedAmount")}
          />
        </FormField>

        <FormField id="currency" label="Currency" error={fieldError(state, "currency")}>
          <Select name="currency" defaultValue={initial?.currency ?? Currency.USD}>
            <SelectTrigger id="currency" className="w-full" aria-invalid={!!fieldError(state, "currency")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(Currency).map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <FormField id="submissionDate" label="Submission date" error={fieldError(state, "submissionDate")}>
        <Input
          id="submissionDate"
          name="submissionDate"
          type="date"
          defaultValue={initial?.submissionDate}
          required
          aria-invalid={!!fieldError(state, "submissionDate")}
        />
      </FormField>

      <FormField
        id="description"
        label="Description"
        error={fieldError(state, "description")}
        hint={`${description.length}/${DESCRIPTION_MAX} characters`}
      >
        <Textarea
          id="description"
          name="description"
          rows={4}
          maxLength={DESCRIPTION_MAX}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          aria-invalid={!!fieldError(state, "description")}
        />
      </FormField>

      <div className="flex justify-end gap-3">
        <SubmitButton pendingLabel={mode === "create" ? "Creating…" : "Saving…"}>
          {mode === "create" ? "Create opportunity" : "Save changes"}
        </SubmitButton>
      </div>
    </form>
  );
}
