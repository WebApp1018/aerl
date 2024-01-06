import { Button, Card, Row, Progress, Container } from "@nextui-org/react";
import { createContext, useContext, useEffect, useState } from "react";
import { Database } from "@/supabase/types";
import { XSquare } from "react-feather";

type Severity = Database["public"]["Enums"]["severity"] | "success";

type Toast = {
  id: number;
  message: string;
  description?: string;
  severity?: Severity;
};

function ToastCard({ toast }: { toast: Toast }) {
  let [timer, setTimer] = useState(100);
  const t = useToast();

  useEffect(() => {
    let interval = setInterval(() => {
      setTimer((prevTimer) => prevTimer - 0.5);
    }, 15);

    if (timer <= 0) {
      t.remove(toast.id);
    }

    return () => {
      clearInterval(interval);
    };
  }, [timer, toast.id, t]);

  const color = toast.severity == "information" ? "primary" : toast.severity;

  return (
    <Card
      variant="bordered"
      css={{
        py: "0.25em",
        mt: "1rem",
        borderColor: "$border",
        background: "$backgroundContrast",
        shadow: "$lg",
      }}
    >
      <Card.Header css={{ m: 0, fontWeight: "$bold" }}>
        <Row justify="space-between" align="center">
          {toast.message}
          <Button
            aria-label="Dismiss notification"
            light
            size="sm"
            icon={<XSquare />}
            css={{ minWidth: 0, pr: 5, opacity: 0.5 }}
            animated={false}
            onPress={() => t.remove(toast.id)}
          />
        </Row>
      </Card.Header>
      <Card.Body css={{ py: 5 }}>{toast.description}</Card.Body>
      <Card.Footer>
        <Progress
          color={color}
          status={color}
          size="xs"
          value={timer}
          animated={false}
        />
      </Card.Footer>
    </Card>
  );
}

type NewToast = {
  message: string;
  description?: string;
  severity?: Severity;
};

type Context = {
  notifications: Toast[];
  add: (toast: NewToast) => { id: number };
  remove: (id: number) => void;
};

export const ToastContext = createContext<Context>({
  notifications: [],
  add: (toast: NewToast) => {
    return { id: 0 };
  },
  remove: (id: number) => {},
});

export function ToastContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Toast[]>([]);

  const value = {
    notifications: notifications,
    add: (toast: NewToast) => {
      const rng = Math.random() * 100000;

      setNotifications((notifications) => [
        {
          id: rng,
          message: toast.message,
          description: toast.description,
          severity: toast.severity,
        },
        ...notifications,
      ]);

      return { id: rng };
    },
    remove: (id: number) => {
      setNotifications((notifications) =>
        notifications.filter((n) => n.id != id),
      );
    },
  };

  useEffect(() => {}, []);

  return (
    <ToastContext.Provider value={value}>
      <Container
        css={{
          position: "fixed",
          bottom: "1rem",
          left: "1rem",
          zIndex: "10000",
          mw: "400px",
          p: 0,
        }}
      >
        {notifications.map((toast) => (
          <ToastCard key={toast.id} toast={toast} />
        ))}
      </Container>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
