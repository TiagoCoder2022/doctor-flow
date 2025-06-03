"use server";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import { generateTimeSlots } from "@/_helpers/time";
import { db } from "@/db";
import { appointmentsTable, doctorsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

dayjs.extend(utc);
dayjs.extend(timezone);

export const getAvailableTimes = actionClient
  .schema(
    z.object({
      doctorId: z.string(),
      date: z.string().date(), // YYYY-MM-DD,
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      throw new Error("Unauthorized");
    }
    if (!session.user.clinic) {
      throw new Error("Clínica não encontrada");
    }
    const doctor = await db.query.doctorsTable.findFirst({
      where: eq(doctorsTable.id, parsedInput.doctorId),
    });
    if (!doctor) {
      throw new Error("Médico não encontrado");
    }
    //Verifica se o médico está disponível na data selecionada se nao estiver retorna um array vazio
    const selectedDayOfWeek = dayjs(parsedInput.date).day();
    const doctorIsAvailable =
      selectedDayOfWeek >= doctor.availableFromWeekDay &&
      selectedDayOfWeek <= doctor.availableToWeekDay;
    if (!doctorIsAvailable) {
      return [];
    }
    // verifica quais agendamentos ele tem na data selecionada
    const appointments = await db.query.appointmentsTable.findMany({
      where: eq(appointmentsTable.doctorId, parsedInput.doctorId),
    });
    const appointmentsOnSelectedDate = appointments
      .filter((appointment) => {
        return dayjs(appointment.date).isSame(parsedInput.date, "day");
      })
      .map((appointment) => dayjs(appointment.date).format("HH:mm:ss"));
    const timeSlots = generateTimeSlots();

    // Converte o horário de disponibilidade do médico para o horário local
    const doctorAvailableFrom = dayjs()
      .utc()
      .set("hour", Number(doctor.availableFromTime.split(":")[0]))
      .set("minute", Number(doctor.availableFromTime.split(":")[1]))
      .set("second", 0)
      .local();
    const doctorAvailableTo = dayjs()
      .utc()
      .set("hour", Number(doctor.availableToTime.split(":")[0]))
      .set("minute", Number(doctor.availableToTime.split(":")[1]))
      .set("second", 0)
      .local();

    //Gera os TimesSlot e veririfca quais desses horários já tem agendamento e quais deles estao na dentro da disponibilidade
    const doctorTimeSlots = timeSlots.filter((time) => {
      const date = dayjs()
        .utc()
        .set("hour", Number(time.split(":")[0]))
        .set("minute", Number(time.split(":")[1]))
        .set("second", 0);

      return (
        date.format("HH:mm:ss") >= doctorAvailableFrom.format("HH:mm:ss") &&
        date.format("HH:mm:ss") <= doctorAvailableTo.format("HH:mm:ss")
      );
    });

    //Retorna os horários que estão disponíveis ou não
    return doctorTimeSlots.map((time) => {
      return {
        value: time,
        available: !appointmentsOnSelectedDate.includes(time),
        label: time.substring(0, 5),
      };
    });
  });
