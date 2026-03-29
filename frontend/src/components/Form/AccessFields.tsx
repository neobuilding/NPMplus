// import { IconSettings } from "@tabler/icons-react";
import { IconLock, IconLockOpen2 } from "@tabler/icons-react";
// import CodeEditor from "@uiw/react-textarea-code-editor";
// import cn from "classnames";
// import { Field/*, useFormikContext */} from "formik";
// import { useState } from "react";
import type { AccessList, ProxyLocation/*, ProxyHost*/ } from "src/api/backend";
import { formatDateTime, intl, T } from "src/locale";
// import styles from "./LocationsFields.module.css";
import type { ReactNode } from "react";
import type { SingleValue, MultiValue } from "react-select";
import Select, { /*type ActionMeta,*/ components, type OptionProps } from "react-select";
import { useLocaleState } from "src/context";
import { useAccessLists } from "src/hooks";
// import { AccessField } from "src/components";

interface Props {
	location?: string;
	initialAccessListType: ProxyLocation["accessListType"];
	initialAccessLists: AccessList[];
	onChange: (field: string, value: any) => void;
}

interface AccessOption {
	readonly value: number;
	readonly label: string;
	readonly subLabel: string;
	readonly meta: AccessList;
}

interface AccessTypeOption {
	readonly label: string;
	readonly subLabel: string;
	readonly icon?: ReactNode;

}

const Option = (props: OptionProps<AccessOption>) => {
	return (
		<components.Option {...props}>
			<div className="flex-fill">
				<div className="font-weight-medium">
					<strong>{props.data.label}</strong>
				</div>
				<div className="text-secondary mt-1 ps-3">{props.data.subLabel}</div>
			</div>
		</components.Option>
	);
};

const TypeOption = (props: OptionProps<AccessTypeOption>) => {
	return (
		<components.Option {...props}>
			<div className="flex-fill">
				<div className="font-weight-medium">
					{props.data.icon} <strong>{props.data.label}</strong>
				</div>
				<div className="text-secondary mt-1 ps-3">{props.data.subLabel}</div>
			</div>
		</components.Option>
	);
};

export function AccessFields({ initialAccessListType, location, initialAccessLists, onChange/*, name = "access-lists", label = "access-list", id = "accessListId"*/ }: Props) {

	const values = initialAccessLists;
	const aclValue = initialAccessListType;
	const { locale } = useLocaleState();
	const { isLoading, isError, error, data } = useAccessLists(["owner", "items", "clients"]);

	const createDefaultItem = (item: AccessList): AccessOption => {
		return {
			value: item.id || 0,
			label: item.name,
			subLabel: intl.formatMessage(
				{ id: "access-list.subtitle" },
				{
					users: item?.items?.length,
					rules: item?.clients?.length,
					date: item?.createdOn ? formatDateTime(item?.createdOn, locale) : "N/A",
				},
			),
			meta: item
		};
	}

	const createOption = (label: ProxyLocation["accessListType"]): AccessTypeOption => {
		if (label == "global") {
			return {
				label: label,
				subLabel: intl.formatMessage({ id: "access-list.global" }),
			};
		}
		if (label == "custom") {
			return {
				icon: <IconLock size={14} className="text-lime" />,
				label: label,
				subLabel: intl.formatMessage({ id: "access-list.custom" }),
			};
		}
		return {
			icon: <IconLockOpen2 size={14} className="text-red" />,
			label: label,
			subLabel: intl.formatMessage({ id: "access-list.public" }),
		};

	}

	const options: AccessOption[] =
		data?.map(createDefaultItem) || [];

	const typeOptions = (): AccessTypeOption[] => {
		let ret = [];
		if (!isLoading && !isError && location !== undefined) {
			ret.push(createOption("global"));
		}
		ret.push(createOption("public"));
		if (!isLoading && !isError) {
			ret.push(createOption("custom"));
		}
		return ret;

	}

	const findFirstAvailableOption = (): AccessOption | undefined => {
		const used = new Set(values?.map((item: AccessList) => (item.id || 0)) || []);
		for (const opt of options) {
			if (!used.has(opt.value)) {
				return opt; // first available in order
			}
		}
	}

	const onAccessListChange = (value: SingleValue<AccessOption> | MultiValue<AccessOption>, acl: AccessList) => {
		value = value;
		acl = acl;
		// todo implement this correctly
		// const accessList = new Array(values?.map((item: AccessList) => (item.id || 0)) || []);
		// if (value) {
		// 	accessList
		// 	onChange("accessList", value);
		// }
	}
	const handleAdd = () => {
		const newAccessOption = findFirstAvailableOption();
		if (newAccessOption) {
			onChange("accessList", newAccessOption.meta);
		}
	}

	const handleRemove = (idx: number) => {
		idx = idx;
		onChange("accessListRemoved", idx);
	}


	return (
		<div className="mb-3">

			{isLoading ? <div className="placeholder placeholder-lg col-12 my-3 placeholder-glow" /> : null}
			{isError ? <div className="invalid-feedback">{`${error}`}</div> : null}
			<div className="row">
				<div className="col-md-10">
					<div className="input-group mb-3">
						<Select<AccessTypeOption>
							className="react-select-container"
							classNamePrefix="react-select"
							defaultValue={createOption(initialAccessListType)}
							options={typeOptions()}
							components={{ Option: TypeOption }}
							styles={{
								option: (base) => ({
									...base,
									height: "100%",
								}),
							}}
							onChange={(e) => onChange("accessControlType", (e as SingleValue<AccessTypeOption>)?.label || null)} />
					</div>
				</div>
			</div>
			{!isLoading && !isError && aclValue == "custom" ?
				<>
					{values.map((item: AccessList, idx: number) => (
						<div className="input-group mb-3">
							<Select
								className="react-select-container"
								classNamePrefix="react-select"
								defaultValue={options.find((o) => o.value === item.id) || findFirstAvailableOption()}
								options={options}
								components={{ Option }}
								styles={{
									option: (base) => ({
										...base,
										height: "100%",
									}),
								}}
								onChange={(e) => onAccessListChange(e, item)}
								isDisabled={aclValue != "custom"}
							/>
							<a
								role="button"
								className="btn btn-ghost btn-danger p-0"
								onClick={(e) => {
									e.preventDefault();
									handleRemove(idx);
								}}
							></a>
						</div>
					))}
					<div className="text-center">
						<button type="button" className="btn my-3" onClick={handleAdd}>
							<T id="action.add" />
						</button>
					</div>
				</>
				: null}
		</div>
	);
}
