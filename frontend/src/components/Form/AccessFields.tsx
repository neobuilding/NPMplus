import { IconLock, IconLockOpen2, IconX } from "@tabler/icons-react";
import {  useFormikContext } from "formik";
import { useState, ReactNode } from "react";
import Select, { components, type OptionProps } from "react-select";
import type { AccessList, ProxyLocation } from "src/api/backend";
import { useLocaleState } from "src/context";
import { useAccessLists } from "src/hooks";
import { formatDateTime, intl, T } from "src/locale";

interface Props {
	location?: string;
	initialAccessListType: ProxyLocation["accessListType"];
	initialAccessLists: AccessList[];
	name: string;
	//onChange: (field: string, value: any) => void;
}

interface AccessOption {
	readonly value: number;
	readonly label: string;
	readonly subLabel: string;
	readonly meta: AccessList;
}

interface AccessTypeOption {
	readonly label: string;
	readonly type: ProxyLocation["accessListType"];
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
					{props.data.icon}<strong>{props.data.label}</strong>
				</div>
				<div className="text-secondary mt-1 ps-3">{props.data.subLabel}</div>
			</div>
		</components.Option>
	);
};

export function AccessFields({ initialAccessListType, location, initialAccessLists, name }: Props) {

	const [values, setValues] = useState(initialAccessLists || []);
	const [aclValue, setAclValue] = useState(initialAccessListType);
	const { locale } = useLocaleState();
	const { setFieldValue } = useFormikContext();
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

	const createOption = (type: ProxyLocation["accessListType"]): AccessTypeOption => {
		if (type == "global") {
			return {
				type: type,
				label: intl.formatMessage({ id: "access-list.global" }),
				subLabel: intl.formatMessage({ id: "access-list.global.subtitle" }),
			};
		}
		if (type == "custom") {
			return {
				icon: <IconLock size={14} className="text-lime" />,
				type: type,
				label: intl.formatMessage({ id: "access-list.custom" }),
				subLabel: intl.formatMessage({ id: "access-list.custom.subtitle" }),
			};
		}
		return {
			icon: <IconLockOpen2 size={14} className="text-red" />,
			type: type,
			label: intl.formatMessage({ id: "access-list.public" }),
			subLabel: intl.formatMessage({ id: "access-list.public.subtitle" }),
		};

	}

	const defaultOptions: AccessOption[] =
		data?.map(createDefaultItem) || [];
	const valuesSet = new Set(values?.map((item: AccessList) => (item.id || 0)) || []);
	const options = defaultOptions.filter((option:AccessOption,_) =>!valuesSet.has(option.value));

	const typeOptions = (): AccessTypeOption[] => {
		let ret = [];
		if (!isLoading && !isError && location !== undefined) {
			ret.push(createOption("global"));
		}
		ret.push(createOption("public"));
		if (!isLoading && !isError && defaultOptions.length > 0) {
			ret.push(createOption("custom"));
		}
		return ret;
	}

	const findFirstAvailableOption = (): AccessOption | undefined => {
		return options.length > 0 ? options[0] : undefined;
	}

	const onAccessListChange = (acl: AccessList, idx: number) => {
		acl = acl;
		values[idx] = acl;
		setValues(values);
		setFieldValue(name, values);
	}
	const handleAdd = () => {
		const newAccessOption = findFirstAvailableOption();
		if (newAccessOption) {
			setValues([...values, newAccessOption.meta]);
			setFieldValue(name, newAccessOption.meta);
		}
	}

	const handleRemove = (idx: number) => {
 		const newValues = values.filter((_, i: number) => i !== idx);
		setValues(newValues)
		setFieldValue(name, newValues);
	}

	return (
		<div className="mb-3">

			{isLoading ? <div className="placeholder placeholder-lg col-12 my-3 placeholder-glow" /> : null}
			{isError ? <div className="invalid-feedback">{`${error}`}</div> : null}
			<div className="row">
				<div className="col-md-10">
					<div className="input-group mb-3">
						<Select<AccessTypeOption, false>
							className="react-select-container"
							classNamePrefix="react-select"
							isSearchable={false}
							defaultValue={createOption(initialAccessListType)}
							options={typeOptions()}
							components={{ Option: TypeOption }}
							styles={{
								option: (base) => ({
									...base,
									height: "100%",
								}),
							}}
							onChange={(e) => {
								if (!e || Array.isArray(e))  return;
								const value = e.type;
								setAclValue(value);
								setFieldValue("accessListType", value);
							}}
						/>
					</div>
				</div>
			</div>
			{!isLoading && !isError && aclValue == "custom" ?
				<>
					{values.map((item: AccessList, idx: number) => (
						<div className="input-group mb-3">
							<Select<AccessOption, false>
								className="react-select-container"
								classNamePrefix="react-select"
								defaultValue={defaultOptions.find((o) => o.value === item.id) || findFirstAvailableOption()}
								options={options}
								components={{ Option }}
								styles={{
									option: (base) => ({
										...base,
										height: "100%",
									}),
								}}
								onChange={(e) => 
									{
										if (!e || Array.isArray(e))  return;
										onAccessListChange(e.meta, idx);
									}}
								isDisabled={aclValue != "custom"}
							/>
							<a
								role="button"
								className="btn btn-ghost btn-danger p-0"
								onClick={(e) => {
									e.preventDefault();
									handleRemove(idx);
								}}
							>
								<IconX size={16} />
							</a>
						</div>
					))}
					
					{values.length < defaultOptions.length && ( // only show add button if there are more acls that can be added
						<div className="text-center">
							<button type="button" className="btn my-3" onClick={handleAdd}>
								<T id="action.add" />
							</button>
						</div>
					)}
				</>
				: null}
		</div>
	);
}
