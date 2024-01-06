import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/react";
import { Lock, Wifi } from "../../../components/icons";
import { useNavigate } from 'react-router-dom';

export default function Scan() {

  const navigate = useNavigate();

  const rows = [
    {
      ssid: "AERL",
      protected: true,
      strength: 0,
    },
    {
      ssid: "Recharge Cafe",
      protected: false,
      strength: 0,
    },
    {
      ssid: "FBI Van",
      protected: true,
      strength: 0,
    },
    {
      ssid: "Tesla",
      protected: true,
      strength: 0,
    },
    {
      ssid: "PowerWall",
      protected: true,
      strength: 0,
    },
  ];

  const columns = [
    {
      key: "ssid",
      label: "SSID",
    },
    {
      key: "details",
      label: "DETAILS"
    }
  ];


  return (
    <div className=" p-5">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="my-10 text-center text-2xl font-bold leading-9 tracking-tight text-black dark:text-white">
          Please select a WiFi network
        </h2>
      </div>

      <Table
        selectionMode="single"
        isStriped
        onRowAction={(key) => { navigate(`/setup/wifi/connect/${key}`) }}
        hideHeader
        aria-label="Wifi networks">
        <TableHeader columns={columns}>
          {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
        </TableHeader>
        <TableBody items={rows}>
          {(item) => (
            <TableRow key={item.ssid}>
              <TableCell className="dark:text-white">{item.ssid}</TableCell>
              <TableCell className="dark:text-white flex justify-end pr-5"> {item.protected && <a className="mx-2"><Lock /></a>} <Wifi /></TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

}