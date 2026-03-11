"use client";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	CalendarIcon,
	ClipboardListIcon,
	CreditCardIcon,
	Loader2Icon,
	PhoneIcon,
	StickyNoteIcon,
	Trash2Icon,
	UserIcon,
	XCircleIcon,
	XIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	formatEventPrice,
	getRegistrationStatusColor,
	getRegistrationStatusLabel,
} from "@/lib/format-event";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface RegistrationDetailSheetProps {
	registrationId: string;
}

function DetailRow({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex justify-between items-start py-2.5">
			<span className="text-sm text-muted-foreground">{label}</span>
			<span className="text-sm font-medium text-right max-w-[60%]">
				{children}
			</span>
		</div>
	);
}

function DetailSection({
	title,
	icon,
	children,
}: {
	title: string;
	icon?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<div>
			<div className="flex items-center gap-2 mb-2">
				{icon && <span className="text-muted-foreground">{icon}</span>}
				<h4 className="text-sm font-semibold text-foreground">{title}</h4>
			</div>
			<div className="divide-y divide-border rounded-xl border bg-card px-4">
				{children}
			</div>
		</div>
	);
}

export const RegistrationDetailSheet = NiceModal.create(
	({ registrationId }: RegistrationDetailSheetProps) => {
		const modal = useModal();
		const router = useRouter();
		const utils = trpc.useUtils();

		const { data: registration, isPending } =
			trpc.organization.sportsEvent.getRegistration.useQuery(
				{ id: registrationId },
				{ enabled: modal.visible },
			);

		const cancelMutation =
			trpc.organization.sportsEvent.cancelRegistration.useMutation({
				onSuccess: () => {
					toast.success("Inscripción cancelada");
					utils.organization.sportsEvent.listRegistrations.invalidate();
					utils.organization.sportsEvent.getRegistration.invalidate({
						id: registrationId,
					});
					utils.organization.sportsEvent.get.invalidate();
				},
				onError: (error: { message?: string }) => {
					toast.error(error.message || "Error al cancelar la inscripción");
				},
			});

		const deleteMutation =
			trpc.organization.sportsEvent.deleteRegistration.useMutation({
				onSuccess: () => {
					toast.success("Inscripción eliminada");
					modal.hide();
					utils.organization.sportsEvent.listRegistrations.invalidate();
					utils.organization.sportsEvent.get.invalidate();
				},
				onError: (error: { message?: string }) => {
					toast.error(error.message || "Error al eliminar la inscripción");
				},
			});

		const isCancelled = registration?.status === "cancelled";

		return (
			<AnimatePresence mode="wait">
				{modal.visible && (
					<>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
							onClick={() => modal.hide()}
							aria-hidden="true"
						/>

						{/* Sheet */}
						<motion.div
							initial={{ x: "100%" }}
							animate={{ x: 0 }}
							exit={{ x: "100%" }}
							transition={{
								type: "spring",
								damping: 30,
								stiffness: 300,
							}}
							className={cn(
								"fixed inset-y-0 right-0 z-50 flex w-full flex-col",
								"bg-background shadow-2xl",
								"border-l border-border",
								"max-w-md",
							)}
						>
							{/* Header with accent stripe */}
							<div className="relative shrink-0">
								<div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary to-primary/80" />

								<div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
									<div className="flex items-start gap-3">
										<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-sm">
											<ClipboardListIcon className="size-5" />
										</div>
										<div>
											<h2 className="font-semibold text-lg tracking-tight">
												Detalle de inscripción
											</h2>
											{registration && (
												<p className="mt-0.5 text-muted-foreground text-sm">
													#{registration.registrationNumber}
												</p>
											)}
										</div>
									</div>
									<button
										type="button"
										onClick={() => modal.hide()}
										className={cn(
											"flex size-8 items-center justify-center rounded-lg transition-all duration-150",
											"text-muted-foreground hover:text-foreground hover:bg-muted",
											"focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
										)}
									>
										<XIcon className="size-4" />
										<span className="sr-only">Cerrar</span>
									</button>
								</div>

								<div className="h-px bg-border" />
							</div>

							{/* Content */}
							<div className="flex-1 overflow-y-auto">
								{isPending ? (
									<div className="flex items-center justify-center py-16">
										<Loader2Icon className="size-6 animate-spin text-muted-foreground" />
									</div>
								) : registration ? (
									<div className="space-y-5 px-6 py-5">
										{/* Name + Status header */}
										<div className="flex items-center justify-between gap-3">
											<div className="min-w-0">
												<p className="text-base font-semibold truncate">
													{registration.registrantName}
												</p>
												<p className="text-sm text-muted-foreground truncate">
													{registration.registrantEmail}
												</p>
											</div>
											<Badge
												className={cn(
													"border-none px-2.5 py-1 font-medium text-xs shadow-none shrink-0",
													getRegistrationStatusColor(registration.status),
												)}
												variant="outline"
											>
												{getRegistrationStatusLabel(registration.status)}
											</Badge>
										</div>

										{/* Inscripción */}
										<DetailSection
											title="Inscripción"
											icon={<CalendarIcon className="size-4" />}
										>
											<DetailRow label="Número">
												#{registration.registrationNumber}
											</DetailRow>
											<DetailRow label="Fuente">
												{registration.registrationSource ?? "-"}
											</DetailRow>
											<DetailRow label="Fecha">
												{format(
													registration.registeredAt,
													"dd MMM yyyy HH:mm",
													{
														locale: es,
													},
												)}
											</DetailRow>
											{registration.ageCategory && (
												<DetailRow label="Categoría">
													{registration.ageCategory.displayName}
												</DetailRow>
											)}
											{registration.waitlistPosition && (
												<DetailRow label="Posición lista de espera">
													#{registration.waitlistPosition}
												</DetailRow>
											)}
										</DetailSection>

										{/* Datos personales */}
										<DetailSection
											title="Datos personales"
											icon={<UserIcon className="size-4" />}
										>
											<DetailRow label="Nombre">
												{registration.registrantName}
											</DetailRow>
											<DetailRow label="Email">
												{registration.registrantEmail}
											</DetailRow>
											{registration.registrantPhone && (
												<DetailRow label="Teléfono">
													{registration.registrantPhone}
												</DetailRow>
											)}
											{registration.registrantBirthDate && (
												<DetailRow label="Fecha de nacimiento">
													{format(
														registration.registrantBirthDate,
														"dd/MM/yyyy",
													)}
												</DetailRow>
											)}
										</DetailSection>

										{/* Contacto de emergencia */}
										{registration.emergencyContactName && (
											<DetailSection
												title="Contacto de emergencia"
												icon={<PhoneIcon className="size-4" />}
											>
												<DetailRow label="Nombre">
													{registration.emergencyContactName}
												</DetailRow>
												{registration.emergencyContactPhone && (
													<DetailRow label="Teléfono">
														{registration.emergencyContactPhone}
													</DetailRow>
												)}
												{registration.emergencyContactRelation && (
													<DetailRow label="Relación">
														{registration.emergencyContactRelation}
													</DetailRow>
												)}
											</DetailSection>
										)}

										{/* Pago */}
										<DetailSection
											title="Pago"
											icon={<CreditCardIcon className="size-4" />}
										>
											<DetailRow label="Precio">
												{formatEventPrice(
													registration.price,
													registration.currency,
												)}
											</DetailRow>
											{registration.discountAmount > 0 && (
												<DetailRow label="Descuento">
													<span className="text-emerald-600">
														-
														{formatEventPrice(
															registration.discountAmount,
															registration.currency,
														)}
													</span>
												</DetailRow>
											)}
											<DetailRow label="Pagado">
												{formatEventPrice(
													registration.paidAmount,
													registration.currency,
												)}
											</DetailRow>
											{registration.appliedPricingTier && (
												<DetailRow label="Tier">
													{registration.appliedPricingTier.name}
												</DetailRow>
											)}
										</DetailSection>

										{/* Notas */}
										{(registration.notes || registration.internalNotes) && (
											<DetailSection
												title="Notas"
												icon={<StickyNoteIcon className="size-4" />}
											>
												{registration.notes && (
													<DetailRow label="Notas">
														{registration.notes}
													</DetailRow>
												)}
												{registration.internalNotes && (
													<DetailRow label="Notas internas">
														{registration.internalNotes}
													</DetailRow>
												)}
											</DetailSection>
										)}
									</div>
								) : (
									<p className="text-muted-foreground text-center py-16">
										No se encontró la inscripción
									</p>
								)}
							</div>

							{/* Footer */}
							{registration && (
								<div className="shrink-0 border-t bg-muted/30 px-6 py-4">
									<div className="flex items-center gap-3">
										{registration.athleteId && (
											<Button
												variant="outline"
												className="flex-1"
												onClick={() => {
													modal.hide();
													router.push(
														`/dashboard/organization/athletes/${registration.athleteId}`,
													);
												}}
											>
												<UserIcon className="mr-2 size-4" />
												Ver atleta
											</Button>
										)}

										{isCancelled ? (
											<Button
												variant="destructive"
												className={registration.athleteId ? "" : "flex-1"}
												onClick={() => {
													NiceModal.show(ConfirmationModal, {
														title: "¿Eliminar inscripción?",
														message:
															"Esta acción es irreversible. Se eliminará permanentemente el registro de inscripción.",
														confirmLabel: "Eliminar",
														destructive: true,
														onConfirm: () =>
															deleteMutation.mutate({ id: registrationId }),
													});
												}}
												disabled={deleteMutation.isPending}
												loading={deleteMutation.isPending}
											>
												<Trash2Icon className="mr-2 size-4" />
												Eliminar
											</Button>
										) : (
											<Button
												variant="destructive"
												className={registration.athleteId ? "" : "flex-1"}
												onClick={() => {
													NiceModal.show(ConfirmationModal, {
														title: "¿Cancelar inscripción?",
														message:
															"¿Estás seguro de que deseas cancelar esta inscripción?",
														confirmLabel: "Cancelar inscripción",
														destructive: true,
														onConfirm: () =>
															cancelMutation.mutate({ id: registrationId }),
													});
												}}
												disabled={cancelMutation.isPending}
												loading={cancelMutation.isPending}
											>
												<XCircleIcon className="mr-2 size-4" />
												Cancelar
											</Button>
										)}
									</div>
								</div>
							)}
						</motion.div>
					</>
				)}
			</AnimatePresence>
		);
	},
);
