import { useGetDecisionTypesQuery } from "@/services/CaseApi";
import { useGetResourcesQuery } from "@/services/ReferenceApi";
import {
  Drawer,
  DrawerProps,
  Checkbox,
  Form,
  DatePicker,
  Space,
  Button,
  Select,
} from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const { RangePicker } = DatePicker;

interface FilterModalProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  isDrawerOpen: boolean;
  onClose: () => void;
  onReset: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFormFinish: (values: any) => void;
}

const FilterModal = (props: FilterModalProps) => {
  const { form, isDrawerOpen, onClose, onFormFinish, onReset } = props;
  const [placement] = useState<DrawerProps["placement"]>("right");
  const { t } = useTranslation();

  const { data: resources } = useGetResourcesQuery();
  const { data: decisionTypes } = useGetDecisionTypesQuery();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFinish = (values: any) => {
    console.log(values);
    onFormFinish(values);
    onClose();
  };

  return (
    <>
      <Drawer
        title="Filters"
        placement={placement}
        closable={false}
        onClose={onClose}
        open={isDrawerOpen}
        key={placement}
      >
        <Form
          form={form}
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 18 }}
          layout="horizontal"
          onFinish={onFinish}
        >
          <div className=" flex justify-end items-end -mb-6">
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {t("apply")}
                </Button>
                <Button htmlType="button" onClick={onReset}>
                  {t("reset")}
                </Button>
              </Space>
            </Form.Item>
          </div>
          <div>
            <div className="p-2">
              <div className="text-lg font-bold">{t("articles")}</div>
              <div className="text-sm font-semibold p-2">{t("search-in")}:</div>
              <div className="ml-6">
                <Form.Item
                  className="mb-0"
                  name="articleName"
                  valuePropName="checked"
                >
                  <Checkbox>Name</Checkbox>
                </Form.Item>
                <Form.Item
                  className="mb-0"
                  name="articleNumber"
                  valuePropName="checked"
                >
                  <Checkbox>{t("number")}</Checkbox>
                </Form.Item>
                <Form.Item
                  className="mb-0"
                  name="articleText"
                  valuePropName="checked"
                >
                  <Checkbox>Text</Checkbox>
                </Form.Item>
              </div>
            </div>

            <div className="p-2">
              <div className="text-lg font-bold">{t("cases")}</div>
              <div className="text-sm font-semibold p-2">{t("search-in")}:</div>
              <div className="ml-6">
                <Form.Item
                  className="mb-0"
                  name="caseName"
                  valuePropName="checked"
                >
                  <Checkbox>Name</Checkbox>
                </Form.Item>
                <Form.Item
                  className="mb-0"
                  name="caseNumber"
                  valuePropName="checked"
                >
                  <Checkbox>{t("number")}</Checkbox>
                </Form.Item>
                <Form.Item
                  className="mb-0"
                  name="caseHeadnotes"
                  valuePropName="checked"
                >
                  <Checkbox>{t("headnotes")}</Checkbox>
                </Form.Item>
                <Form.Item
                  className="mb-0"
                  name="caseFacts"
                  valuePropName="checked"
                >
                  <Checkbox>{t("facts")}</Checkbox>
                </Form.Item>
                <Form.Item
                  className="mb-0"
                  name="caseJudgement"
                  valuePropName="checked"
                >
                  <Checkbox>{t("judgement")}</Checkbox>
                </Form.Item>
                <Form.Item
                  className="mb-0"
                  name="caseReasoning"
                  valuePropName="checked"
                >
                  <Checkbox>{t("reasoning")}</Checkbox>
                </Form.Item>
              </div>
              <div className="text-sm font-semibold p-2">{t("filter-by")}:</div>
              <div className="ml-6">
                <Form.Item className="mb-1" name="caseYear">
                  <RangePicker picker="year" />
                </Form.Item>
                <Form.Item
                  className="mb-0"
                  name="caseDecision"
                  label={t("decision")}
                  labelCol={{ span: 24 }}
                  wrapperCol={{ span: 24 }}
                >
                  <Select
                    className="-mt-2"
                    mode="multiple"
                    options={decisionTypes?.map((decisionType) => ({
                      label: decisionType,
                      value: decisionType,
                    }))}
                  />
                </Form.Item>
              </div>
            </div>
            <div className="p-2">
              <div className="text-lg font-bold">{t("books")}</div>
              <div className="text-sm font-semibold p-2">{t("search-in")}:</div>
              <div className="ml-6">
                <Form.Item
                  className="mb-2"
                  name="tbRefArtCases"
                  valuePropName="checked"
                >
                  <Checkbox>{t("references-to-articles-and-cases")}</Checkbox>
                </Form.Item>
                <Form.Item
                  className="mb-2"
                  name="tbContextReferences"
                  valuePropName="checked"
                >
                  <Checkbox>{t("context-of-the-references")}</Checkbox>
                </Form.Item>
              </div>
              <div className="text-sm font-semibold p-2">{t("filter-by")}:</div>
              <div className="ml-6">
                <Form.Item
                  className="mb-0"
                  name="referenceResource"
                  label={t("resources")}
                  valuePropName="checked"
                  labelCol={{ span: 24 }}
                  wrapperCol={{ span: 24 }}
                >
                  <Select
                    className="-mt-2"
                    mode="multiple"
                    options={resources?.map((resource) => ({
                      label: resource,
                      value: resource,
                    }))}
                  />
                </Form.Item>
              </div>
            </div>
          </div>
          <div className=" flex justify-end items-end">
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {t("apply")}
                </Button>
                <Button htmlType="button" onClick={onReset}>
                  {t("reset")}
                </Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </>
  );
};

export default FilterModal;
