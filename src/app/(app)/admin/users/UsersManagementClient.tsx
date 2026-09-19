"use client";

import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { UserRole } from "@prisma/client";

import { listUsers } from "@/actions/users";
import { UserFormDialog } from "@/components/admin/UserFormDialog";
import { UserRowActions } from "@/components/admin/UserRowActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { RoleBadge } from "@/components/ui/status-badges";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";

export function UsersManagementClient({ currentUserId }: { currentUserId: string }) {
  const { data: result, isLoading, error, mutate } = useSWR(["users"], () => listUsers());
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");

  const filtered = useMemo(() => {
    if (!result?.ok) return [];
    const term = search.trim().toLowerCase();
    return result.data.filter((user) => {
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const matchesSearch =
        term.length === 0 ||
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);
      return matchesRole && matchesSearch;
    });
  }, [result, search, roleFilter]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage team accounts, roles, and access. Admin only.
          </p>
        </div>
        <UserFormDialog
          mode="create"
          title="New user"
          description="Create an account and assign its role. They can sign in right away."
          trigger={
            <Button>
              <Plus />
              New user
            </Button>
          }
          onSaved={() => mutate()}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
          <label htmlFor="user-search" className="text-sm font-medium text-foreground">
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="user-search"
              type="search"
              placeholder="Name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="user-role-filter" className="text-sm font-medium text-foreground">
            Role
          </label>
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | "ALL")}>
            <SelectTrigger id="user-role-filter" className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All roles</SelectItem>
              {Object.values(UserRole).map((role) => (
                <SelectItem key={role} value={role}>
                  {role.charAt(0) + role.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? <TableSkeleton cols={6} /> : null}

      {error || (result && !result.ok) ? (
        <ErrorState
          message={result && !result.ok ? result.error.message : "Could not load users."}
          onRetry={() => mutate()}
        />
      ) : null}

      {result?.ok && filtered.length === 0 ? (
        <EmptyState title="No users match these filters" description="Try a different search term or role." />
      ) : null}

      {result?.ok && filtered.length > 0 ? (
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">
                        {user.name}
                        {user.id === currentUserId ? (
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
                        ) : null}
                      </span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>
                    {user.disabledAt ? (
                      <Badge variant="destructive">Disabled</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.role === "REVIEWER"
                      ? `${user.activeReviewingCount} active review${user.activeReviewingCount === 1 ? "" : "s"}`
                      : `${user.createdOpportunityCount} created`}
                  </TableCell>
                  <TableCell>
                    <UserRowActions user={user} isSelf={user.id === currentUserId} onChanged={() => mutate()} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : null}
    </div>
  );
}
