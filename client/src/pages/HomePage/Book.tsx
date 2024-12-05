import { BookModal } from "@/components";
import { useGetBooksQuery } from "@/services/BookApi";
import { Book as BookType } from "@/types";
import { CaretLeftOutlined, CaretRightOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row, Space } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const Book = () => {
  const { data: books } = useGetBooksQuery();
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState({} as BookType);
  const [current, setCurrent] = useState(1);
  const { t } = useTranslation();

  const pageSize = 3;

  const handleNext = () => {
    if (books && current < Math.ceil(books.length / pageSize)) {
      setCurrent(current + 1);
    }
  };

  const handlePrev = () => {
    if (current > 1) {
      setCurrent(current - 1);
    }
  };

  let currentPageBooks;

  if (books) {
    currentPageBooks = books.slice(
      (current - 1) * pageSize,
      current * pageSize
    );
  }

  const openBookModal = (book: BookType) => {
    setSelectedBook(book);
    setIsBookModalOpen(true);
  };

  return (
    <>
      {books && (
        <div className="p-4" id="recommended-books">
          <div className="font-semibold">{t("recommended-books")}</div>
          <div className="mt-2 flex">
            <Button
              className="mt-16 mr-2"
              onClick={handlePrev}
              disabled={current === 1}
              icon={<CaretLeftOutlined />}
              type="text"
            ></Button>
            <div style={{ width: "100%" }}>
              <Row gutter={[16, 16]}>
                {currentPageBooks?.map((book) => (
                  <Col
                    key={book.id}
                    xs={24} // Full width on extra small screens
                    sm={24} // Half width on small screens
                    md={24} // One-third width on medium screens
                    lg={8}
                  >
                    <Card
                      title={book.id}
                      className=" h-44 drop-shadow-md"
                      extra={
                        <Button onClick={() => openBookModal(book)}>
                          {t("in-the-book")}
                        </Button>
                      }
                    >
                      <div className="flex">
                        <Space direction="vertical">
                          <div>
                            <span className="font-semibold">
                              {t("publisher")}:
                            </span>
                            <span className="pl-2">De Gruyter</span>
                          </div>
                          <div>
                            <span className="font-semibold">{t("year")}:</span>
                            <span className="pl-2">{2022}</span>
                          </div>
                        </Space>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
            <Button
              onClick={handleNext}
              className="mt-16 ml-2"
              disabled={current === Math.ceil(books.length / pageSize)}
              icon={<CaretRightOutlined />}
              type="text"
            ></Button>
          </div>
        </div>
      )}
      {isBookModalOpen && (
        <BookModal
          book={selectedBook}
          isOpen={isBookModalOpen}
          onClose={() => setIsBookModalOpen(false)}
        />
      )}
    </>
  );
};

export default Book;
